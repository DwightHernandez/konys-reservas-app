import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../services/supabase';
import { DIAS_SEMANA, JORNADAS_DEFAULT, etiquetaFecha, fechaLocalISO, generarSlots, horaAMinutos, minutosAHora } from '../../utils/reservas';

const C = { ink: '#351510', orange: '#F58A24', cream: '#F7F5F2', muted: '#727982', line: '#E9E4DE', white: '#FFFFFF', pale: '#FFF3E4', gray: '#E6E8EB' };

function fechaLarga(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function ReservarScreen() {
  const { mesaId } = useLocalSearchParams();
  const [mesa, setMesa] = useState(null);
  const [fechas] = useState(() => Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return etiquetaFecha(date);
  }));
  const [fecha, setFecha] = useState(() => fechaLocalISO(new Date()));
  const [horarios, setHorarios] = useState([]);
  const [horariosConfigurados, setHorariosConfigurados] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [slotError, setSlotError] = useState('');
  const [hora, setHora] = useState('');
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [personas, setPersonas] = useState('2');

  useEffect(() => {
    let active = true;
    async function cargarMesa() {
      setLoading(true);
      const { data, error: queryError } = await supabase.from('mesas').select('*').eq('id', mesaId).maybeSingle();
      if (!active) return;
      setMesa(data || null);
      setError(queryError?.message || (!data ? 'No encontramos esta mesa.' : ''));
      setLoading(false);
    }
    cargarMesa();
    return () => { active = false; };
  }, [mesaId]);

  const cargarDisponibilidad = useCallback(async () => {
    setLoadingSlots(true);
    setSlotError('');
    const [year, month, day] = fecha.split('-').map(Number);
    const dia = DIAS_SEMANA[new Date(year, month - 1, day).getDay()];
    const [horariosResult, reservasResult] = await Promise.all([
      supabase.from('horarios').select('*'),
      supabase.from('reservas').select('hora_inicio,hora_fin,estado').eq('mesa_id', mesaId).eq('fecha', fecha).neq('estado', 'cancelada'),
    ]);
    const todosLosHorarios = horariosResult.data || [];
    setHorariosConfigurados(todosLosHorarios);
    let filasHorarios = todosLosHorarios.filter((item) => String(item.dia_semana || '').toLocaleLowerCase('es-CO') === dia && item.activo !== false);
    if (horariosResult.error) {
      setSlotError('No fue posible consultar los horarios configurados. Mostramos los horarios habituales.');
    }
    if (!horariosResult.error && todosLosHorarios.length === 0) filasHorarios = JORNADAS_DEFAULT;
    if (horariosResult.error) filasHorarios = JORNADAS_DEFAULT;
    setHorarios(filasHorarios);
    setReservas(reservasResult.data || []);
    if (reservasResult.error) setSlotError('No fue posible consultar las reservas existentes. Intenta actualizar la disponibilidad.');
    setLoadingSlots(false);
  }, [fecha, mesaId]);

  useEffect(() => { cargarDisponibilidad(); }, [cargarDisponibilidad]);

  const slots = useMemo(() => {
    const generated = generarSlots(horarios, reservas);
    if (fecha !== fechaLocalISO(new Date())) return generated;
    const now = new Date();
    const currentMinute = now.getHours() * 60 + now.getMinutes();
    return generated.map((slot) => ({ ...slot, pasado: horaAMinutos(slot.hora) <= currentMinute }));
  }, [fecha, horarios, reservas]);
  const almuerzo = slots.filter((slot) => slot.jornada === 'almuerzo');
  const noche = slots.filter((slot) => slot.jornada === 'noche');
  const cantidad = Number(personas);

  const confirmar = async () => {
    if (!hora) return setSlotError('Selecciona un horario disponible.');
    if (!nombre.trim()) return setSlotError('Escribe el nombre de quien hizo la reserva.');
    if (!Number.isInteger(cantidad) || cantidad < 1) return setSlotError('Indica una cantidad válida de personas.');
    if (cantidad > Number(mesa.capacidad)) return setSlotError(`Esta mesa tiene capacidad para ${mesa.capacidad} personas.`);
    setSaving(true);
    setSlotError('');

    const slot = slots.find((item) => item.hora === hora);
    const horario = horarios.find((item) => item.jornada === slot?.jornada);
    const duracion = Math.max(15, Number(horario?.duracion_slot) || 60);
    const horaFin = minutosAHora(horaAMinutos(hora) + duracion);
    const { data: ocupadas, error: checkError } = await supabase
      .from('reservas').select('hora_inicio,hora_fin,estado')
      .eq('mesa_id', mesaId).eq('fecha', fecha).neq('estado', 'cancelada');

    if (checkError) {
      setSlotError('No pudimos verificar si el horario sigue libre. Intenta de nuevo.');
      setSaving(false);
      return;
    }
    const start = horaAMinutos(hora);
    const end = horaAMinutos(horaFin);
    const conflicto = (ocupadas || []).some((item) => {
      const itemStart = horaAMinutos(item.hora_inicio);
      const itemEnd = horaAMinutos(item.hora_fin) || itemStart + duracion;
      return item.estado !== 'cancelada' && start < itemEnd && end > itemStart;
    });
    if (conflicto) {
      setReservas(ocupadas || []);
      setHora('');
      setSlotError('Ese horario acaba de ocuparse. Selecciona otro.');
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from('reservas').insert({
      mesa_id: mesa.id,
      cliente_nombre: nombre.trim(),
      cliente_contacto: contacto.trim() || null,
      num_personas: cantidad,
      fecha,
      hora_inicio: `${hora}:00`,
      hora_fin: `${horaFin}:00`,
      estado: 'confirmada',
    });
    setSaving(false);
    if (insertError) {
      setSlotError(insertError.code === '23505' ? 'Ese horario ya fue reservado. Elige otro.' : 'No se pudo guardar la reserva. Revisa tu conexión e inténtalo otra vez.');
      return;
    }
    router.replace({
      pathname: '/confirmacion',
      params: { mesa: mesa.nombre, zona: mesa.zona, fecha, hora, personas: String(cantidad), nombre: nombre.trim() },
    });
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={C.orange} /></View>;
  if (!mesa) return <SafeAreaView style={styles.safe}><Pressable style={styles.back} onPress={() => router.back()}><Ionicons name="arrow-back" size={20} color={C.ink} /><Text style={styles.backText}>Volver</Text></Pressable><Text style={styles.error}>{error || 'Mesa no disponible.'}</Text></SafeAreaView>;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Pressable style={styles.back} onPress={() => router.back()}><Ionicons name="arrow-back" size={20} color={C.ink} /><Text style={styles.backText}>Volver</Text></Pressable>
        <View style={styles.hero}>
          <Text style={styles.badge}>RESERVAS · BUCARAMANGA</Text>
          <Text style={styles.heroTitle}>Elige tu momento.</Text>
          <Text style={styles.heroBody}>Selecciona la fecha y un horario disponible.</Text>
        </View>
        <View style={styles.summary}><Text style={styles.summaryLabel}>MESA SELECCIONADA</Text><Text style={styles.summaryTitle}>{mesa.nombre} · {mesa.zona}</Text><Text style={styles.muted}>Capacidad máxima {mesa.capacidad} personas</Text></View>

        <Text style={styles.sectionTitle}>¿Qué día nos visitas?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateList}>
          {fechas.map((item) => {
            const selected = item.fecha === fecha;
            const [itemYear, itemMonth, itemDay] = item.fecha.split('-').map(Number);
            const itemWeekday = DIAS_SEMANA[new Date(itemYear, itemMonth - 1, itemDay).getDay()];
            const diaCerrado = horariosConfigurados.length > 0 && !horariosConfigurados.some((schedule) => String(schedule.dia_semana || '').toLocaleLowerCase('es-CO') === itemWeekday && schedule.activo !== false);
            return <Pressable key={item.fecha} disabled={diaCerrado} onPress={() => { setFecha(item.fecha); setHora(''); setSlotError(''); }} style={[styles.dateChip, selected && styles.dateChipActive, diaCerrado && styles.dateChipDisabled]}>
              <Text style={[styles.dateDay, selected && styles.selectedText]}>{item.dia}</Text><Text style={[styles.dateNumber, selected && styles.selectedText]}>{item.numero}</Text>
            </Pressable>;
          })}
        </ScrollView>
        <Text style={styles.selectedDate}>{fechaLarga(fecha)}</Text>

        {loadingSlots ? <ActivityIndicator color={C.orange} style={{ marginVertical: 20 }} /> : <>
          {slotError ? <Text style={styles.error}>{slotError}</Text> : null}
          <Text style={styles.sectionTitle}>ALMUERZO · 12:30 – 2:30 p. m.</Text>
          <View style={styles.slotGrid}>{almuerzo.map((slot) => <Slot key={slot.hora} slot={slot} selected={hora === slot.hora} onPress={() => { setHora(slot.hora); setSlotError(''); }} />)}</View>
          {almuerzo.length === 0 ? <Text style={styles.muted}>No hay horarios de almuerzo este día.</Text> : null}
          <Text style={styles.sectionTitle}>NOCHE · 5:00 – 11:00 p. m.</Text>
          <View style={styles.slotGrid}>{noche.map((slot) => <Slot key={slot.hora} slot={slot} selected={hora === slot.hora} onPress={() => { setHora(slot.hora); setSlotError(''); }} />)}</View>
          {noche.length === 0 ? <Text style={styles.muted}>No hay horarios de noche este día.</Text> : null}
        </>}

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Completa tus datos</Text>
          <Field label="Nombre completo" value={nombre} onChangeText={setNombre} placeholder="Ej. María Rodríguez" />
          <Field label="Número de contacto (opcional)" value={contacto} onChangeText={setContacto} placeholder="300 000 0000" keyboardType="phone-pad" />
          <Field label="Número de personas" value={personas} onChangeText={setPersonas} placeholder="2 personas" keyboardType="number-pad" />
          <Text style={styles.helper}>Máximo {mesa.capacidad} personas para esta mesa.</Text>
        </View>
        <View style={styles.reservationSummary}><Text style={styles.summaryLabel}>RESUMEN DE TU RESERVA</Text><Text style={styles.summaryTitle}>{mesa.nombre} · {hora || 'Elige una hora'}</Text><Text style={styles.muted}>{fechaLarga(fecha)} · {personas || 0} personas</Text></View>
      </ScrollView>
      <View style={styles.footer}>
        {slotError ? <Text style={styles.errorFooter}>{slotError}</Text> : null}
        <Pressable style={[styles.button, saving && styles.disabled]} onPress={confirmar} disabled={saving}>
          {saving ? <ActivityIndicator color={C.white} /> : <Text style={styles.buttonText}>Confirmar reserva</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Slot({ slot, selected, onPress }) {
  const disabled = slot.ocupado || slot.pasado;
  return <Pressable disabled={disabled} onPress={onPress} style={[styles.slot, disabled && styles.slotOccupied, selected && styles.slotSelected]}><Text style={[styles.slotText, disabled && styles.slotTextOccupied, selected && styles.selectedText]}>{slot.hora}</Text>{disabled ? <Text style={styles.taken}>{slot.ocupado ? 'Ocupado' : 'Pasó'}</Text> : null}</Pressable>;
}

function Field({ label, ...props }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...props} style={styles.input} placeholderTextColor="#A0A4AA" /></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream }, content: { padding: 16, paddingBottom: 160 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.cream },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }, backText: { fontSize: 13, color: C.ink, fontWeight: '700' },
  hero: { backgroundColor: C.ink, borderRadius: 19, padding: 17, marginBottom: 12 }, badge: { color: '#FFD18D', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 }, heroTitle: { color: C.white, fontSize: 21, fontWeight: '900', marginTop: 9 }, heroBody: { color: '#E6D9D5', fontSize: 12, marginTop: 4 },
  summary: { backgroundColor: '#EAF1F4', borderRadius: 13, padding: 13, marginBottom: 18 }, summaryLabel: { color: C.muted, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 }, summaryTitle: { color: C.ink, fontSize: 13, fontWeight: '900', marginTop: 5, textTransform: 'capitalize' }, muted: { color: C.muted, fontSize: 11, marginTop: 3, lineHeight: 16 },
  sectionTitle: { color: C.ink, fontSize: 12, fontWeight: '900', letterSpacing: 0.4, marginTop: 14, marginBottom: 9, textTransform: 'uppercase' }, dateList: { gap: 8, paddingBottom: 4 }, dateChip: { width: 48, height: 58, borderRadius: 12, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' }, dateChipActive: { backgroundColor: C.orange, borderColor: C.orange }, dateChipDisabled: { opacity: 0.35 }, dateDay: { fontSize: 9, color: C.muted, fontWeight: '800' }, dateNumber: { fontSize: 17, color: C.ink, fontWeight: '900', marginTop: 2 }, selectedText: { color: C.white }, selectedDate: { color: C.muted, fontSize: 11, marginTop: 7, textTransform: 'capitalize' },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, slot: { minWidth: 64, borderRadius: 16, borderWidth: 1, borderColor: C.line, backgroundColor: C.white, paddingVertical: 9, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' }, slotSelected: { backgroundColor: C.ink, borderColor: C.ink }, slotOccupied: { backgroundColor: C.gray, borderColor: C.gray }, slotText: { color: C.ink, fontSize: 11, fontWeight: '800' }, slotTextOccupied: { color: '#9AA0A7', textDecorationLine: 'line-through' }, taken: { color: '#858B93', fontSize: 8, marginTop: 1 },
  form: { backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.line, padding: 14, marginTop: 17 }, field: { marginTop: 10 }, label: { color: C.ink, fontSize: 10, fontWeight: '800', marginBottom: 5 }, input: { backgroundColor: C.cream, borderWidth: 1, borderColor: C.line, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 10, color: C.ink, fontSize: 12 }, helper: { color: C.muted, fontSize: 9, marginTop: 6 }, reservationSummary: { backgroundColor: '#FFF1DF', borderRadius: 13, padding: 13, marginTop: 13 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.cream, padding: 14, paddingBottom: 17, borderTopWidth: 1, borderColor: C.line }, button: { backgroundColor: C.orange, borderRadius: 12, padding: 15, alignItems: 'center', justifyContent: 'center', minHeight: 48 }, buttonText: { color: C.white, fontSize: 13, fontWeight: '900' }, disabled: { opacity: 0.7 }, error: { color: '#AE332D', fontSize: 11, lineHeight: 16, marginVertical: 6 }, errorFooter: { color: '#AE332D', fontSize: 10, marginBottom: 5 },
});
