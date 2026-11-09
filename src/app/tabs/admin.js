import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { DIAS_SEMANA, JORNADAS_DEFAULT, fechaLocalISO } from '../../utils/reservas';

const C = { ink: '#351510', orange: '#F58A24', cream: '#F7F5F2', muted: '#727982', line: '#E9E4DE', white: '#FFFFFF', pale: '#FFF3E4', green: '#45915D', red: '#B43D34' };
const SECCIONES = [{ id: 'mesas', label: 'Mesas', icon: 'grid-outline' }, { id: 'horarios', label: 'Horarios', icon: 'time-outline' }, { id: 'reservas', label: 'Reservas', icon: 'calendar-outline' }, { id: 'carta', label: 'Carta', icon: 'restaurant-outline' }];
const CATEGORIAS = ['pizzas', 'entradas', 'postres', 'bebidas'];
const ADMIN_PIN = process.env.EXPO_PUBLIC_ADMIN_PIN || '1234';

const initForm = (type, record) => type === 'mesa' ? { nombre: record?.nombre || '', zona: record?.zona || 'salon', capacidad: String(record?.capacidad || 4), foto_url: record?.foto_url || '', activa: record?.activa ?? true }
  : { nombre: record?.nombre || '', categoria: record?.categoria || 'pizzas', descripcion: record?.descripcion || '', precio: String(record?.precio || ''), disponible: record?.disponible ?? true };

export default function AdminScreen() {
  const [pin, setPin] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [section, setSection] = useState('mesas');
  const [filter, setFilter] = useState('hoy');
  const [mesas, setMesas] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [platos, setPlatos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const loadData = useCallback(async () => {
    setLoading(true); setError('');
    const [tableResult, hoursResult, bookingResult, menuResult] = await Promise.all([
      supabase.from('mesas').select('*').order('nombre'),
      supabase.from('horarios').select('*').order('dia_semana').order('hora_inicio'),
      supabase.from('reservas').select('*').order('fecha', { ascending: true }).order('hora_inicio', { ascending: true }),
      supabase.from('platos').select('*').order('nombre'),
    ]);
    setMesas(tableResult.data || []);
    setHorarios(hoursResult.data || []);
    setReservas(bookingResult.data || []);
    setPlatos(menuResult.data || []);
    const failed = [tableResult, hoursResult, bookingResult, menuResult].find((result) => result.error);
    if (failed) setError(`No se pudieron cargar todos los datos: ${failed.error.message}`);
    setLoading(false);
  }, []);

  useEffect(() => { if (authorized) loadData(); }, [authorized, loadData]);

  const openForm = (type, record = null) => { setModal({ type, record }); setForm(initForm(type, record)); };
  const closeModal = () => { if (!saving) setModal(null); };
  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const saveRecord = async () => {
    if (modal?.type === 'mesa' && (!form.nombre?.trim() || Number(form.capacidad) < 1)) return Alert.alert('Revisa los datos', 'Escribe el nombre de la mesa y una capacidad válida.');
    if (modal?.type === 'plato' && (!form.nombre?.trim() || !form.categoria)) return Alert.alert('Revisa los datos', 'El plato necesita nombre y categoría.');
    setSaving(true);
    const isTable = modal?.type === 'mesa';
    const payload = isTable
      ? { nombre: form.nombre.trim(), zona: form.zona, capacidad: Number(form.capacidad), activa: Boolean(form.activa), foto_url: form.foto_url.trim() || null }
      : { nombre: form.nombre.trim(), categoria: form.categoria, descripcion: form.descripcion.trim() || null, precio: Number(form.precio) || 0, disponible: Boolean(form.disponible) };
    const tableName = isTable ? 'mesas' : 'platos';
    const query = modal.record ? supabase.from(tableName).update(payload).eq('id', modal.record.id) : supabase.from(tableName).insert(payload);
    const { error: saveError } = await query;
    setSaving(false);
    if (saveError) return Alert.alert('No se pudo guardar', saveError.message);
    setModal(null); loadData();
  };

  const deleteRecord = (table, record, label) => Alert.alert(`Eliminar ${label}`, 'Esta acción no se puede deshacer.', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: async () => {
      const { error: deleteError } = await supabase.from(table).delete().eq('id', record.id);
      if (deleteError) Alert.alert('No se pudo eliminar', deleteError.message); else loadData();
    } },
  ]);

  const updateTableActive = async (mesa, activa) => {
    setMesas((items) => items.map((item) => item.id === mesa.id ? { ...item, activa } : item));
    const { error: updateError } = await supabase.from('mesas').update({ activa }).eq('id', mesa.id);
    if (updateError) { Alert.alert('No se pudo actualizar', updateError.message); loadData(); }
  };

  const saveHours = async () => {
    setSaving(true);
    for (const row of horarios) {
      const payload = { dia_semana: row.dia_semana, jornada: row.jornada, hora_inicio: row.hora_inicio, hora_fin: row.hora_fin, duracion_slot: Number(row.duracion_slot) || 60, activo: Boolean(row.activo) };
      const result = row.id
        ? await supabase.from('horarios').update(payload).eq('id', row.id)
        : await supabase.from('horarios').insert(payload);
      if (result.error) { setSaving(false); Alert.alert('No se pudieron guardar los horarios', result.error.message); return; }
    }
    setSaving(false); Alert.alert('Horarios guardados', 'La disponibilidad ya refleja los cambios.'); loadData();
  };

  const addDefaultHours = async () => {
    const additions = DIAS_SEMANA.flatMap((dia_semana) => JORNADAS_DEFAULT.map((horario) => ({ ...horario, dia_semana, activo: true })));
    setSaving(true);
    const { error: insertError } = await supabase.from('horarios').insert(additions);
    setSaving(false);
    if (insertError) Alert.alert('No se pudieron crear', insertError.message); else loadData();
  };

  const changeBookingState = async (reserva, estado) => {
    const { error: updateError } = await supabase.from('reservas').update({ estado }).eq('id', reserva.id);
    if (updateError) Alert.alert('No se pudo cambiar el estado', updateError.message); else loadData();
  };

  const dayReservations = useMemo(() => {
    const today = fechaLocalISO(new Date());
    const tomorrowDate = new Date(); tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = fechaLocalISO(tomorrowDate);
    return reservas.filter((item) => filter === 'todas' || item.fecha === (filter === 'mañana' ? tomorrow : today));
  }, [filter, reservas]);

  if (!authorized) return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
    <ScrollView contentContainerStyle={styles.loginContent} keyboardShouldPersistTaps="handled">
      <View style={styles.header}><View style={styles.brandMark}><Ionicons name="pizza" size={20} color={C.white} /></View><View><Text style={styles.brand}>KONYS PIZZA</Text><Text style={styles.muted}>Panel de administración</Text></View></View>
      <View style={styles.hero}><Text style={styles.badge}>ADMINISTRACIÓN</Text><Text style={styles.heroTitle}>Bienvenido al panel.</Text><Text style={styles.heroBody}>Acceso exclusivo para el equipo de Konys Pizza.</Text></View>
      <View style={styles.loginCard}><Ionicons name="lock-closed" size={22} color={C.orange} /><Text style={styles.sectionTitle}>PIN de seguridad</Text><TextInput style={styles.input} value={pin} onChangeText={setPin} secureTextEntry keyboardType="number-pad" placeholder="••••" placeholderTextColor="#A0A4AA" maxLength={8} onSubmitEditing={() => pin === ADMIN_PIN ? setAuthorized(true) : Alert.alert('PIN incorrecto', 'Verifica el PIN e inténtalo de nuevo.')} /><Pressable style={styles.primaryButton} onPress={() => pin === ADMIN_PIN ? setAuthorized(true) : Alert.alert('PIN incorrecto', 'Verifica el PIN e inténtalo de nuevo.')}><Text style={styles.primaryButtonText}>Ingresar al panel</Text></Pressable></View>
    </ScrollView>
  </SafeAreaView>;

  return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
    <ScrollView contentContainerStyle={styles.content} refreshControl={undefined} showsVerticalScrollIndicator={false}>
      <View style={styles.topHeader}><View><Text style={styles.eyebrow}>ADMINISTRACIÓN</Text><Text style={styles.pageTitle}>{section === 'carta' ? 'Gestiona la carta.' : section === 'horarios' ? 'Horarios de atención.' : section === 'reservas' ? 'Todas las reservas.' : 'Gestiona tus mesas.'}</Text></View><Pressable style={styles.logout} onPress={() => { setAuthorized(false); setPin(''); }}><Ionicons name="log-out-outline" size={18} color={C.ink} /></Pressable></View>
      <View style={styles.stats}><Stat value={String(mesas.length).padStart(2, '0')} label="Mesas" icon="grid-outline" /><Stat value={String(reservas.filter((item) => item.fecha === fechaLocalISO(new Date())).length).padStart(2, '0')} label="Reservas hoy" icon="calendar-outline" /><Stat value={String(mesas.filter((item) => item.activa).length).padStart(2, '0')} label="Activas" icon="checkmark-circle-outline" /></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.adminTabs}>{SECCIONES.map((item) => <Pressable key={item.id} onPress={() => setSection(item.id)} style={[styles.adminTab, section === item.id && styles.adminTabActive]}><Ionicons name={item.icon} size={14} color={section === item.id ? C.white : C.muted} /><Text style={[styles.adminTabText, section === item.id && styles.adminTabTextActive]}>{item.label}</Text></Pressable>)}</ScrollView>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading && !mesas.length && !reservas.length ? <ActivityIndicator color={C.orange} style={{ margin: 30 }} /> : null}
      {section === 'mesas' ? <>
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Mesas registradas</Text><Text style={styles.muted}>{mesas.length} en total</Text></View>
        {mesas.map((mesa) => <View key={mesa.id} style={styles.listCard}><View style={styles.listIcon}><Ionicons name="restaurant-outline" size={18} color={C.orange} /></View><View style={styles.listBody}><Text style={styles.itemTitle}>{mesa.nombre} · {mesa.zona}</Text><Text style={styles.muted}>{mesa.capacidad} personas · {mesa.activa ? 'Disponible' : 'Inactiva'}</Text><View style={styles.actions}><Pressable onPress={() => openForm('mesa', mesa)} style={styles.action}><Ionicons name="create-outline" size={15} color={C.ink} /><Text style={styles.actionText}>Editar</Text></Pressable><Pressable onPress={() => deleteRecord('mesas', mesa, 'mesa')} style={styles.action}><Ionicons name="trash-outline" size={15} color={C.red} /><Text style={[styles.actionText, { color: C.red }]}>Borrar</Text></Pressable></View></View><Switch value={Boolean(mesa.activa)} onValueChange={(value) => updateTableActive(mesa, value)} trackColor={{ false: '#D4D7DB', true: '#F7C489' }} thumbColor={mesa.activa ? C.orange : '#F6F6F6'} /></View>)}
        <Pressable style={styles.primaryButton} onPress={() => openForm('mesa')}><Ionicons name="add" size={18} color={C.white} /><Text style={styles.primaryButtonText}>Nueva mesa</Text></Pressable>
      </> : null}
      {section === 'horarios' ? <>
        <View style={styles.infoCard}><Text style={styles.sectionTitle}>Duración de cada reserva</Text><Text style={styles.muted}>Edita horarios y duración en minutos. Los cambios se usan para generar los turnos disponibles.</Text></View>
        {!horarios.length ? <View style={styles.infoCard}><Text style={styles.muted}>Todavía no hay horarios guardados en Supabase.</Text><Pressable style={[styles.primaryButton, { marginTop: 12 }]} onPress={addDefaultHours} disabled={saving}><Text style={styles.primaryButtonText}>{saving ? 'Creando…' : 'Crear horarios habituales'}</Text></Pressable></View> : DIAS_SEMANA.map((dia) => <View key={dia} style={styles.dayCard}><Text style={styles.dayTitle}>{dia}</Text>{['almuerzo', 'noche'].map((jornada) => {
          const row = horarios.find((item) => item.dia_semana === dia && item.jornada === jornada);
          if (!row) return <Text key={jornada} style={styles.muted}>{jornada}: sin horario configurado</Text>;
          const index = horarios.findIndex((item) => item.id === row.id);
          return <View key={row.id || jornada} style={styles.hourRow}><View style={styles.hourTitle}><Text style={styles.itemTitle}>{jornada}</Text><Switch value={row.activo !== false} onValueChange={(value) => setHorarios((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, activo: value } : item))} trackColor={{ false: '#D4D7DB', true: '#F7C489' }} thumbColor={row.activo === false ? '#F6F6F6' : C.orange} /></View><View style={styles.timeInputs}><TextInput style={styles.smallInput} value={String(row.hora_inicio || '').slice(0, 5)} onChangeText={(value) => setHorarios((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, hora_inicio: value } : item))} placeholder="12:30" /><Text style={styles.muted}>a</Text><TextInput style={styles.smallInput} value={String(row.hora_fin || '').slice(0, 5)} onChangeText={(value) => setHorarios((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, hora_fin: value } : item))} placeholder="14:30" /><TextInput style={styles.durationInput} value={String(row.duracion_slot || 60)} onChangeText={(value) => setHorarios((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, duracion_slot: value } : item))} keyboardType="number-pad" /><Text style={styles.muted}>min</Text></View></View>;
        })}</View>)}
        {horarios.length > 0 ? <Pressable style={styles.primaryButton} onPress={saveHours} disabled={saving}><Text style={styles.primaryButtonText}>{saving ? 'Guardando…' : 'Guardar horarios'}</Text></Pressable> : null}
      </> : null}
      {section === 'reservas' ? <>
        <View style={styles.filters}>{['hoy', 'mañana', 'todas'].map((item) => <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]}><Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item[0].toUpperCase() + item.slice(1)}</Text></Pressable>)}</View>
        {!dayReservations.length ? <View style={styles.infoCard}><Text style={styles.muted}>No hay reservas para este filtro.</Text></View> : dayReservations.map((reserva) => <BookingCard key={reserva.id} reserva={reserva} mesa={mesas.find((item) => String(item.id) === String(reserva.mesa_id))} onState={changeBookingState} />)}
      </> : null}
      {section === 'carta' ? <>
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Platos de la carta</Text><Text style={styles.muted}>{platos.length} registrados</Text></View>
        {platos.map((plato) => <View key={plato.id} style={styles.listCard}><View style={styles.listIcon}><Ionicons name="pizza-outline" size={18} color={C.orange} /></View><View style={styles.listBody}><Text style={styles.itemTitle}>{plato.nombre}</Text><Text style={styles.muted}>{plato.categoria} · ${Number(plato.precio || 0).toLocaleString('es-CO')} · {plato.disponible ? 'Visible' : 'Oculto'}</Text><View style={styles.actions}><Pressable onPress={() => openForm('plato', plato)} style={styles.action}><Ionicons name="create-outline" size={15} color={C.ink} /><Text style={styles.actionText}>Editar</Text></Pressable><Pressable onPress={() => deleteRecord('platos', plato, 'plato')} style={styles.action}><Ionicons name="trash-outline" size={15} color={C.red} /><Text style={[styles.actionText, { color: C.red }]}>Borrar</Text></Pressable></View></View><Switch value={Boolean(plato.disponible)} onValueChange={async (value) => { const { error: updateError } = await supabase.from('platos').update({ disponible: value }).eq('id', plato.id); if (updateError) Alert.alert('No se pudo actualizar', updateError.message); else loadData(); }} trackColor={{ false: '#D4D7DB', true: '#F7C489' }} thumbColor={plato.disponible ? C.orange : '#F6F6F6'} /></View>)}
        <Pressable style={styles.primaryButton} onPress={() => openForm('plato')}><Ionicons name="add" size={18} color={C.white} /><Text style={styles.primaryButtonText}>Agregar plato</Text></Pressable>
      </> : null}
    </ScrollView>
    <RecordModal visible={Boolean(modal)} modal={modal} form={form} setField={setField} onClose={closeModal} onSave={saveRecord} saving={saving} />
  </SafeAreaView>;
}

function Stat({ value, label, icon }) { return <View style={styles.stat}><Ionicons name={icon} size={16} color={C.orange} /><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }

function BookingCard({ reserva, mesa, onState }) {
  const date = new Date(`${reserva.fecha}T12:00:00`).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' });
  const stateColor = reserva.estado === 'cancelada' ? C.red : reserva.estado === 'completada' ? C.muted : C.green;
  return <View style={styles.bookingCard}><View style={styles.bookingHead}><View style={styles.bookingIcon}><Ionicons name="calendar" size={15} color={C.orange} /></View><View style={{ flex: 1 }}><Text style={styles.itemTitle}>{date} · {String(reserva.hora_inicio || '').slice(0, 5)}</Text><Text style={styles.muted}>{mesa?.nombre || `Mesa ${reserva.mesa_id}`} · {reserva.num_personas} personas</Text></View><Text style={[styles.state, { color: stateColor }]}>{reserva.estado}</Text></View><Text style={styles.clientName}>{reserva.cliente_nombre}</Text>{reserva.cliente_contacto ? <Text style={styles.muted}>{reserva.cliente_contacto}</Text> : null}<View style={styles.bookingActions}><Pressable onPress={() => onState(reserva, 'completada')}><Text style={styles.link}>Completar</Text></Pressable><Pressable onPress={() => onState(reserva, 'cancelada')}><Text style={[styles.link, { color: C.red }]}>Cancelar</Text></Pressable></View></View>;
}

function RecordModal({ visible, modal, form, setField, onClose, onSave, saving }) {
  if (!modal) return null;
  const isTable = modal.type === 'mesa';
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.modalShade}><View style={styles.modalCard}><View style={styles.modalHeader}><Text style={styles.modalTitle}>{modal.record ? 'Editar' : 'Agregar'} {isTable ? 'mesa' : 'plato'}</Text><Pressable onPress={onClose}><Ionicons name="close" size={22} color={C.ink} /></Pressable></View>
      <ScrollView keyboardShouldPersistTaps="handled">
        <FormField label={isTable ? 'Nombre o número' : 'Nombre del plato'} value={form.nombre} onChangeText={(value) => setField('nombre', value)} placeholder={isTable ? 'Mesa 01' : 'Pizza Konys Especial'} />
        {isTable ? <><Text style={styles.formLabel}>Zona</Text><View style={styles.choiceRow}>{['salon', 'terraza'].map((value) => <Choice key={value} label={value === 'salon' ? 'Salón' : 'Terraza'} active={form.zona === value} onPress={() => setField('zona', value)} />)}</View><FormField label="Capacidad" value={form.capacidad} onChangeText={(value) => setField('capacidad', value)} keyboardType="number-pad" /><FormField label="Foto URL (opcional)" value={form.foto_url} onChangeText={(value) => setField('foto_url', value)} placeholder="https://…" /><Toggle label="Activa para reservas" value={form.activa} onValueChange={(value) => setField('activa', value)} /></>
          : <><Text style={styles.formLabel}>Categoría</Text><View style={styles.choiceRow}>{CATEGORIAS.map((value) => <Choice key={value} label={value} active={form.categoria === value} onPress={() => setField('categoria', value)} />)}</View><FormField label="Descripción" value={form.descripcion} onChangeText={(value) => setField('descripcion', value)} multiline placeholder="Ingredientes y detalles" /><FormField label="Precio (COP)" value={form.precio} onChangeText={(value) => setField('precio', value)} keyboardType="number-pad" /><Toggle label="Visible en la carta" value={form.disponible} onValueChange={(value) => setField('disponible', value)} /></>}
      </ScrollView>
      <Pressable style={styles.primaryButton} onPress={onSave} disabled={saving}><Text style={styles.primaryButtonText}>{saving ? 'Guardando…' : 'Guardar cambios'}</Text></Pressable>
    </View></View>
  </Modal>;
}

function FormField({ label, ...props }) { return <View style={styles.formField}><Text style={styles.formLabel}>{label}</Text><TextInput {...props} style={[styles.input, props.multiline && { minHeight: 72, textAlignVertical: 'top' }]} placeholderTextColor="#A0A4AA" /></View>; }
function Choice({ label, active, onPress }) { return <Pressable onPress={onPress} style={[styles.choice, active && styles.choiceActive]}><Text style={[styles.choiceText, active && styles.choiceTextActive]}>{label}</Text></Pressable>; }
function Toggle({ label, value, onValueChange }) { return <View style={styles.toggleRow}><Text style={styles.itemTitle}>{label}</Text><Switch value={Boolean(value)} onValueChange={onValueChange} trackColor={{ false: '#D4D7DB', true: '#F7C489' }} thumbColor={value ? C.orange : '#F6F6F6'} /></View>; }

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: C.cream }, content: { padding: 16, paddingBottom: 28 }, loginContent: { flexGrow: 1, justifyContent: 'center', padding: 18 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 }, brandMark: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center' }, brand: { color: C.ink, fontSize: 13, fontWeight: '900' }, muted: { color: C.muted, fontSize: 10, lineHeight: 15 }, hero: { backgroundColor: C.ink, borderRadius: 19, padding: 18 }, badge: { color: '#FFD18D', fontSize: 9, fontWeight: '900', letterSpacing: 0.7 }, heroTitle: { color: C.white, fontSize: 20, fontWeight: '900', marginTop: 12 }, heroBody: { color: '#E6D9D5', fontSize: 11, marginTop: 5 }, loginCard: { backgroundColor: C.white, padding: 18, borderRadius: 16, marginTop: 13, borderWidth: 1, borderColor: C.line, gap: 10 }, sectionTitle: { color: C.ink, fontSize: 13, fontWeight: '900' }, input: { backgroundColor: C.white, borderRadius: 9, borderWidth: 1, borderColor: C.line, paddingHorizontal: 11, paddingVertical: 10, color: C.ink, fontSize: 12 }, primaryButton: { backgroundColor: C.orange, paddingVertical: 13, paddingHorizontal: 15, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, marginTop: 10 }, primaryButtonText: { color: C.white, fontSize: 12, fontWeight: '900' },
  topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, eyebrow: { color: C.orange, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 }, pageTitle: { color: C.ink, fontSize: 19, fontWeight: '900', marginTop: 3 }, logout: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: C.white, borderRadius: 11, borderWidth: 1, borderColor: C.line }, stats: { flexDirection: 'row', gap: 8, marginTop: 13 }, stat: { flex: 1, borderRadius: 12, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, padding: 10, alignItems: 'flex-start' }, statValue: { color: C.ink, fontSize: 19, fontWeight: '900', marginTop: 3 }, statLabel: { color: C.muted, fontSize: 8, marginTop: 1 }, adminTabs: { gap: 7, paddingVertical: 13 }, adminTab: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, paddingHorizontal: 11, paddingVertical: 9, borderRadius: 16 }, adminTabActive: { backgroundColor: C.ink, borderColor: C.ink }, adminTabText: { color: C.muted, fontSize: 10, fontWeight: '700' }, adminTabTextActive: { color: C.white },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 6 }, listCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: C.white, borderRadius: 13, borderWidth: 1, borderColor: C.line, padding: 11, marginBottom: 9 }, listIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center' }, listBody: { flex: 1 }, itemTitle: { color: C.ink, fontSize: 11, fontWeight: '800', textTransform: 'capitalize' }, actions: { flexDirection: 'row', gap: 14, marginTop: 8 }, action: { flexDirection: 'row', alignItems: 'center', gap: 3 }, actionText: { color: C.ink, fontSize: 9, fontWeight: '700' }, error: { color: C.red, fontSize: 10, lineHeight: 15, marginVertical: 5 },
  infoCard: { backgroundColor: '#FFF1DF', borderRadius: 13, padding: 13, marginBottom: 10 }, dayCard: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 13, padding: 12, marginBottom: 9 }, dayTitle: { color: C.ink, fontSize: 12, fontWeight: '900', textTransform: 'capitalize', marginBottom: 5 }, hourRow: { borderTopWidth: 1, borderColor: '#F1EEEA', paddingTop: 8, marginTop: 5 }, hourTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, timeInputs: { flexDirection: 'row', alignItems: 'center', gap: 7 }, smallInput: { width: 62, borderWidth: 1, borderColor: C.line, borderRadius: 7, padding: 7, color: C.ink, textAlign: 'center', fontSize: 10 }, durationInput: { width: 52, borderWidth: 1, borderColor: C.line, borderRadius: 7, padding: 7, color: C.ink, textAlign: 'center', fontSize: 10, marginLeft: 'auto' },
  filters: { flexDirection: 'row', gap: 7, marginBottom: 10 }, filter: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 15, paddingHorizontal: 13, paddingVertical: 8 }, filterActive: { backgroundColor: C.orange, borderColor: C.orange }, filterText: { color: C.muted, fontSize: 10, fontWeight: '700' }, filterTextActive: { color: C.white }, bookingCard: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 13, padding: 12, marginBottom: 9 }, bookingHead: { flexDirection: 'row', alignItems: 'center', gap: 8 }, bookingIcon: { width: 29, height: 29, borderRadius: 9, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center' }, state: { fontSize: 8, fontWeight: '900', textTransform: 'uppercase' }, clientName: { color: C.ink, fontSize: 12, fontWeight: '800', marginTop: 9 }, bookingActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 8 }, link: { color: C.green, fontSize: 9, fontWeight: '800' },
  modalShade: { flex: 1, backgroundColor: 'rgba(25,18,15,0.45)', justifyContent: 'flex-end' }, modalCard: { backgroundColor: C.cream, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 17, maxHeight: '88%' }, modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, modalTitle: { color: C.ink, fontSize: 16, fontWeight: '900', textTransform: 'capitalize' }, formField: { marginBottom: 10 }, formLabel: { color: C.ink, fontSize: 10, fontWeight: '800', marginBottom: 5, textTransform: 'capitalize' }, choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }, choice: { borderWidth: 1, borderColor: C.line, backgroundColor: C.white, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7 }, choiceActive: { borderColor: C.orange, backgroundColor: C.orange }, choiceText: { color: C.muted, fontSize: 9, fontWeight: '700', textTransform: 'capitalize' }, choiceTextActive: { color: C.white }, toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
});
