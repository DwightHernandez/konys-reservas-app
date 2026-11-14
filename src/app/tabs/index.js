import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../services/supabase';

const C = { ink: '#351510', orange: '#F58A24', cream: '#F7F5F2', muted: '#727982', line: '#E9E4DE', white: '#FFFFFF', pale: '#FFF3E4' };

export default function InicioScreen() {
  const [mesas, setMesas] = useState([]);
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargarMesas = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase
      .from('mesas')
      .select('*')
      .order('nombre');
    if (queryError) setError('No pudimos cargar las mesas. Desliza hacia abajo para intentar de nuevo.');
    else setMesas(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { cargarMesas(); }, [cargarMesas]);

  const reservar = () => {
    if (mesaSeleccionada) router.push(`/reservar/${mesaSeleccionada}`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={cargarMesas} tintColor={C.orange} />}
      >
        <View style={styles.header}>
          <View style={styles.brandMark}><Ionicons name="pizza" size={21} color={C.white} /></View>
          <View style={styles.brandText}><Text style={styles.brand}>KONYS PIZZA</Text><Text style={styles.tagline}>La pizza más icónica</Text></View>
          <Ionicons name="ellipsis-horizontal" size={22} color={C.ink} />
        </View>

        <View style={styles.hero}>
          <Text style={styles.badge}>RESERVAS · BUCARAMANGA</Text>
          <Text style={styles.heroTitle}>Una mesa te espera.</Text>
          <Text style={styles.heroBody}>Reserva en pocos pasos y disfruta tu visita a Konys Pizza.</Text>
          <View style={styles.pizzaPanel}>
            <View style={styles.pizzaCircle}><Ionicons name="pizza" size={54} color={C.orange} /></View>
            <Text style={styles.pizzaCaption}>RECIÉN HORNEADA</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Horarios de atención</Text>
          <View style={styles.hoursRow}><Ionicons name="sunny" size={16} color={C.orange} /><Text style={styles.body}>Almuerzo · 12:30 – 2:30 p. m.</Text></View>
          <View style={styles.hoursRow}><Ionicons name="moon" size={16} color={C.ink} /><Text style={styles.body}>Noche · 5:00 – 11:00 p. m.</Text></View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeading}><Text style={styles.sectionTitle}>Mesas disponibles</Text><Text style={styles.count}>{mesas.filter((mesa) => mesa.activa).length} activas</Text></View>
          {loading && mesas.length === 0 ? <ActivityIndicator color={C.orange} style={styles.loader} /> : null}
          {error ? <Pressable onPress={cargarMesas}><Text style={styles.error}>{error}</Text></Pressable> : null}
          {!loading && !error && mesas.length === 0 ? <Text style={styles.muted}>Aún no hay mesas registradas.</Text> : null}
          {mesas.map((mesa) => {
            const selected = mesaSeleccionada === mesa.id;
            return (
              <Pressable
                key={mesa.id}
                onPress={() => mesa.activa && setMesaSeleccionada(selected ? null : mesa.id)}
                disabled={!mesa.activa}
                style={[styles.tableRow, selected && styles.tableRowSelected, !mesa.activa && styles.inactive]}
              >
                <View style={[styles.tableIcon, selected && styles.tableIconSelected]}><Ionicons name="restaurant-outline" size={17} color={selected ? C.white : C.ink} /></View>
                <View style={styles.tableInfo}><Text style={styles.tableName}>{mesa.nombre}</Text><Text style={styles.muted}>{mesa.zona} · {mesa.capacidad} personas</Text></View>
                <Text style={[styles.status, !mesa.activa && styles.muted]}>{mesa.activa ? 'Disponible' : 'Inactiva'}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={[styles.button, !mesaSeleccionada && styles.buttonDisabled]} onPress={reservar} disabled={!mesaSeleccionada}>
          <Text style={styles.buttonText}>Reservar mesa</Text><Ionicons name="arrow-forward" size={18} color={C.white} />
        </Pressable>
        <View style={styles.bottomNote}><Ionicons name="heart" size={14} color={C.orange} /><Text style={styles.muted}>Te esperamos para compartir algo delicioso.</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream }, content: { padding: 16, paddingBottom: 26 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  brandMark: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center' },
  brandText: { flex: 1 }, brand: { color: C.ink, fontSize: 14, fontWeight: '900', letterSpacing: 0.6 }, tagline: { color: C.muted, fontSize: 10, marginTop: 2 },
  hero: { backgroundColor: C.ink, borderRadius: 21, padding: 18, marginBottom: 14 },
  badge: { alignSelf: 'flex-start', backgroundColor: '#183747', color: '#FFD18D', overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10, fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  heroTitle: { color: C.white, fontSize: 23, fontWeight: '900', marginTop: 12 }, heroBody: { color: '#E6D9D5', fontSize: 12, lineHeight: 18, marginTop: 5 },
  pizzaPanel: { backgroundColor: C.white, borderRadius: 14, marginTop: 14, height: 92, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  pizzaCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFE4B8', alignItems: 'center', justifyContent: 'center' }, pizzaCaption: { fontSize: 9, color: C.orange, fontWeight: '900', letterSpacing: 0.7 },
  card: { backgroundColor: C.white, borderRadius: 17, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: C.line, elevation: 1 },
  sectionTitle: { color: C.ink, fontSize: 14, fontWeight: '800', marginBottom: 10 }, cardHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, count: { color: C.muted, fontSize: 10, marginBottom: 10 },
  hoursRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 4 }, body: { color: C.muted, fontSize: 12 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderTopWidth: 1, borderTopColor: '#F1EEEA', gap: 9 }, tableRowSelected: { backgroundColor: C.pale, borderRadius: 10, paddingHorizontal: 7 }, tableIcon: { width: 30, height: 30, borderRadius: 9, backgroundColor: '#F2EEE9', alignItems: 'center', justifyContent: 'center' }, tableIconSelected: { backgroundColor: C.ink }, tableInfo: { flex: 1 }, tableName: { color: C.ink, fontSize: 12, fontWeight: '800', textTransform: 'capitalize' }, status: { color: '#45915D', fontSize: 9, fontWeight: '700' }, inactive: { opacity: 0.45 },
  muted: { color: C.muted, fontSize: 11, lineHeight: 16 }, error: { color: '#B43D34', fontSize: 12, lineHeight: 18 }, loader: { padding: 14 },
  button: { backgroundColor: C.orange, borderRadius: 12, paddingVertical: 15, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, buttonDisabled: { opacity: 0.45 }, buttonText: { color: C.white, fontWeight: '900', fontSize: 13 }, bottomNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 18 },
});
