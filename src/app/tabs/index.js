import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../../services/supabase';
import { JORNADAS_DEFAULT, fechaLocalISO, generarSlots, horaAMinutos } from '../../utils/reservas';
import { useAppTheme } from '../../constants/theme';

const normalizar = (valor) => String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-CO');
const nombreDia = (fecha) => normalizar(new Date(`${fecha}T12:00:00`).toLocaleDateString('es-CO', { weekday: 'long' }));
const horariosDelDia = (todos, fecha) => !todos.length ? JORNADAS_DEFAULT : todos.filter((item) => normalizar(item.dia_semana) === nombreDia(fecha) && item.activo !== false);
const opcionesFecha = () => Array.from({ length: 14 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() + index); return fechaLocalISO(date); });
const tieneTurnoFuturo = (horarios, fecha) => {
  if (fecha !== fechaLocalISO(new Date())) return generarSlots(horarios).length > 0;
  const now = new Date();
  const minutoActual = now.getHours() * 60 + now.getMinutes();
  return horarios.some((horario) => horaAMinutos(horario.hora_inicio) <= minutoActual && minutoActual < horaAMinutos(horario.hora_fin))
    || generarSlots(horarios).some((slot) => horaAMinutos(slot.hora) > minutoActual);
};

export default function InicioScreen() {
  const C = useAppTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  const [mesas, setMesas] = useState([]);
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [fecha, setFecha] = useState(() => fechaLocalISO(new Date()));
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDisponibilidad, setLoadingDisponibilidad] = useState(true);
  const [error, setError] = useState('');
  const [errorDisponibilidad, setErrorDisponibilidad] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);
  const fechaInicializada = useRef(false);
  const fechas = opcionesFecha();

  const cargarMesas = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    setError('');
    const [mesaResult, horariosResult] = await Promise.all([
      supabase.from('mesas').select('*').order('nombre'),
      supabase.from('horarios').select('*'),
    ]);
    if (mesaResult.error) setError('No pudimos cargar las mesas. Desliza hacia abajo para intentar de nuevo.');
    else setMesas(mesaResult.data || []);
    const horariosCargados = horariosResult.error ? [] : horariosResult.data || [];
    setHorarios(horariosCargados);
    if (!fechaInicializada.current) {
      const hoy = fechaLocalISO(new Date());
      const date = new Date(); date.setDate(date.getDate() + 1);
      setFecha(tieneTurnoFuturo(horariosDelDia(horariosCargados, hoy), hoy) ? hoy : fechaLocalISO(date));
      fechaInicializada.current = true;
    }
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => {
    cargarMesas();
    setRefreshToken((value) => value + 1);
    const channel = supabase.channel('cliente-disponibilidad')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mesas' }, () => cargarMesas({ quiet: true }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas' }, () => setRefreshToken((value) => value + 1))
      .subscribe();
    const refreshInterval = setInterval(() => {
      cargarMesas({ quiet: true });
      setRefreshToken((value) => value + 1);
    }, 15000);
    return () => {
      clearInterval(refreshInterval);
      supabase.removeChannel(channel);
    };
  }, [cargarMesas]));

  useEffect(() => {
    let active = true;
    const cargarReservasDelDia = async () => {
      setLoadingDisponibilidad(true);
      setErrorDisponibilidad('');
      const { data, error: queryError } = await supabase.from('reservas')
        .select('mesa_id,hora_inicio,hora_fin,estado').eq('fecha', fecha).neq('estado', 'cancelada');
      if (!active) return;
      if (queryError) { setReservas([]); setErrorDisponibilidad('No pudimos verificar la disponibilidad. Desliza para intentar de nuevo.'); }
      else setReservas(data || []);
      setLoadingDisponibilidad(false);
    };
    cargarReservasDelDia();
    return () => { active = false; };
  }, [fecha, refreshToken]);

  const disponibilidad = useCallback((mesa) => {
    if (!mesa.activa || loadingDisponibilidad || error || errorDisponibilidad) return false;
    const slots = generarSlots(horariosDelDia(horarios, fecha), reservas.filter((item) => String(item.mesa_id) === String(mesa.id)));
    const futuros = fecha === fechaLocalISO(new Date())
      ? slots.filter((slot) => horaAMinutos(slot.hora) > new Date().getHours() * 60 + new Date().getMinutes())
      : slots;
    return futuros.some((slot) => !slot.ocupado);
  }, [loadingDisponibilidad, error, errorDisponibilidad, horarios, fecha, reservas]);

  useEffect(() => {
    if (mesaSeleccionada === null) return;
    const mesaElegida = mesas.find((item) => item.id === mesaSeleccionada);
    if (!mesaElegida || !disponibilidad(mesaElegida)) setMesaSeleccionada(null);
  }, [mesaSeleccionada, mesas, disponibilidad]);

  const fechaOpciones = fechas.map((item, index) => ({
    fecha: item,
    etiqueta: index === 0 ? 'Hoy' : index === 1 ? 'Mañana' : new Date(`${item}T12:00:00`).toLocaleDateString('es-CO', { weekday: 'short' }).replace('.', ''),
    dia: new Date(`${item}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }).replace('.', ''),
  }));

  const reservar = () => {
    const mesa = mesas.find((item) => item.id === mesaSeleccionada);
    if (mesa && disponibilidad(mesa)) router.push({ pathname: `/reservar/${mesaSeleccionada}`, params: { fecha } });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading || loadingDisponibilidad} onRefresh={() => { setRefreshToken((value) => value + 1); cargarMesas(); }} tintColor={C.orange} />}
      >
        <View style={styles.header}>
          <Image source={require('../../../assets/images/konys/KKonys.png')} style={styles.brandMark} resizeMode="cover" accessibilityLabel="Logo Konys Pizza" />
          <View style={styles.brandText}><Text style={styles.brand}>KONYS PIZZA</Text><Text style={styles.tagline}>La pizza más ikónica</Text></View>
          <Ionicons name="ellipsis-horizontal" size={22} color={C.ink} />
        </View>

        <View style={styles.hero}>
          <Text style={styles.badge}>RESERVAS · BUCARAMANGA</Text>
          <Text style={styles.heroTitle}>Una mesa te espera.</Text>
          <Text style={styles.heroBody}>Reserva en pocos pasos y disfruta tu visita a Konys Pizza.</Text>
          <Image
            source={require('../../../assets/images/konys/konysLugar.png')}
            style={styles.pizzaPanel}
            resizeMode="cover"
            accessibilityLabel="Konys Pizza"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Horarios de atención</Text>
          <View style={styles.hoursRow}><Ionicons name="sunny" size={16} color={C.orange} /><Text style={styles.body}>Almuerzo · 12:30 – 2:30 p. m.</Text></View>
          <View style={styles.hoursRow}><Ionicons name="moon" size={16} color={C.ink} /><Text style={styles.body}>Noche · 5:00 – 11:00 p. m.</Text></View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeading}><Text style={styles.sectionTitle}>Mesas por día</Text><Text style={styles.count}>{mesas.filter(disponibilidad).length} disponibles</Text></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateList}>
            {fechaOpciones.map((item) => <Pressable key={item.fecha} onPress={() => { setFecha(item.fecha); setMesaSeleccionada(null); }} style={[styles.dateChip, fecha === item.fecha && styles.dateChipSelected]}><Text style={[styles.dateLabel, fecha === item.fecha && styles.dateTextSelected]}>{item.etiqueta}</Text><Text style={[styles.dateNumber, fecha === item.fecha && styles.dateTextSelected]}>{item.dia}</Text></Pressable>)}
          </ScrollView>
          {errorDisponibilidad ? <Pressable onPress={() => setRefreshToken((value) => value + 1)}><Text style={styles.error}>{errorDisponibilidad}</Text></Pressable> : null}
          {loadingDisponibilidad ? <ActivityIndicator color={C.orange} style={styles.loader} /> : null}
          {loading && mesas.length === 0 ? <ActivityIndicator color={C.orange} style={styles.loader} /> : null}
          {error ? <Pressable onPress={cargarMesas}><Text style={styles.error}>{error}</Text></Pressable> : null}
          {!loading && !error && mesas.length === 0 ? <Text style={styles.muted}>Aún no hay mesas registradas.</Text> : null}
          {mesas.map((mesa) => {
            const disponible = disponibilidad(mesa);
            const selected = mesaSeleccionada === mesa.id;
            return (
              <Pressable
                key={mesa.id}
                onPress={() => disponible && setMesaSeleccionada(selected ? null : mesa.id)}
                disabled={!disponible}
                style={[styles.tableRow, selected && styles.tableRowSelected, !disponible && styles.inactive]}
              >
                <View style={[styles.tableIcon, selected && styles.tableIconSelected]}><Ionicons name="restaurant-outline" size={17} color={selected ? C.white : C.ink} /></View>
                <View style={styles.tableInfo}><Text style={styles.tableName}>{mesa.nombre}</Text><Text style={styles.muted}>{mesa.zona} · {mesa.capacidad} personas</Text></View>
                <Text style={[styles.status, !disponible && styles.unavailable]}>{disponible ? 'Disponible' : 'No disponible'}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={[styles.button, !mesaSeleccionada && styles.buttonDisabled]} onPress={reservar} disabled={!mesaSeleccionada}>
          <Text style={styles.buttonText}>Reservar mesa</Text><Ionicons name="arrow-forward" size={18} color={C.orangeText} />
        </Pressable>
        <View style={styles.bottomNote}><Ionicons name="heart" size={14} color={C.orange} /><Text style={styles.muted}>Te esperamos para compartir algo delicioso.</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream }, content: { padding: 16, paddingBottom: 26 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  brandMark: { width: 38, height: 38, borderRadius: 19, overflow: 'hidden' },
  brandText: { flex: 1 }, brand: { color: C.ink, fontSize: 14, fontWeight: '900', letterSpacing: 0.6 }, tagline: { color: C.muted, fontSize: 10, marginTop: 2 },
  hero: { backgroundColor: C.hero, borderRadius: 21, padding: 18, marginBottom: 14 },
  badge: { alignSelf: 'flex-start', backgroundColor: C.badgeBg, color: C.badgeText, overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10, fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  heroTitle: { color: C.white, fontSize: 23, fontWeight: '900', marginTop: 12 }, heroBody: { color: C.heroBody, fontSize: 12, lineHeight: 18, marginTop: 5 },
  pizzaPanel: { width: '100%', height: 110, borderRadius: 14, marginTop: 14, overflow: 'hidden' },
  card: { backgroundColor: C.surface, borderRadius: 17, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: C.line, elevation: 1 },
  sectionTitle: { color: C.ink, fontSize: 14, fontWeight: '800', marginBottom: 10 }, cardHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, count: { color: C.muted, fontSize: 10, marginBottom: 10 },
  hoursRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 4 }, body: { color: C.muted, fontSize: 12 },
  dateList: { gap: 7, paddingBottom: 10 }, dateChip: { minWidth: 61, paddingHorizontal: 9, paddingVertical: 8, borderRadius: 11, backgroundColor: C.cream, borderWidth: 1, borderColor: C.line, alignItems: 'center' }, dateChipSelected: { backgroundColor: C.orange, borderColor: C.orange }, dateLabel: { color: C.muted, fontSize: 9, fontWeight: '800', textTransform: 'capitalize' }, dateNumber: { color: C.ink, fontSize: 10, fontWeight: '700', marginTop: 3, textTransform: 'capitalize' }, dateTextSelected: { color: C.orangeText },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderTopWidth: 1, borderTopColor: C.line, gap: 9 }, tableRowSelected: { backgroundColor: C.pale, borderRadius: 10, paddingHorizontal: 7 }, tableIcon: { width: 30, height: 30, borderRadius: 9, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center' }, tableIconSelected: { backgroundColor: C.hero }, tableInfo: { flex: 1 }, tableName: { color: C.ink, fontSize: 12, fontWeight: '800', textTransform: 'capitalize' }, status: { color: C.green, fontSize: 9, fontWeight: '700' }, unavailable: { color: C.muted, fontSize: 9, fontWeight: '700' }, inactive: { opacity: 0.45 },
  muted: { color: C.muted, fontSize: 11, lineHeight: 16 }, error: { color: C.red, fontSize: 12, lineHeight: 18 }, loader: { padding: 14 },
  button: { backgroundColor: C.orange, borderRadius: 12, paddingVertical: 15, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, buttonDisabled: { opacity: 0.45 }, buttonText: { color: C.orangeText, fontWeight: '900', fontSize: 13 }, bottomNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 18 },
});
