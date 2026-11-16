import React, { useCallback, useMemo, useState } from 'react';
import AppFooter from '../../components/appFooter';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../services/supabase';
import { dineroCOP } from '../../utils/reservas';
import { useAppTheme } from '../../constants/theme';

const CATEGORIAS = [
  { id: 'todas', label: 'Todo' }, { id: 'pizzas', label: 'Pizzas' }, { id: 'entradas', label: 'Entradas' }, { id: 'postres', label: 'Postres' }, { id: 'bebidas', label: 'Bebidas' },
];

export default function CartaScreen() {
  const C = useAppTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  const [platos, setPlatos] = useState([]);
  const [categoria, setCategoria] = useState('todas');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const cargar = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase.from('platos').select('*').eq('disponible', true).order('nombre');
    if (queryError) setError('No pudimos cargar la carta. Comprueba que la tabla “platos” esté disponible en Supabase.');
    else setPlatos(data || []);
    setLoading(false);
  }, []);
  useFocusEffect(useCallback(() => {
    cargar();
    const channel = supabase.channel('cliente-carta')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platos' }, () => cargar({ quiet: true }))
      .subscribe();
    const refreshInterval = setInterval(() => cargar({ quiet: true }), 15000);
    return () => {
      clearInterval(refreshInterval);
      supabase.removeChannel(channel);
    };
  }, [cargar]));
  const visibles = useMemo(() => categoria === 'todas' ? platos : platos.filter((plato) => String(plato.categoria || '').toLowerCase() === categoria), [categoria, platos]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={loading} onRefresh={cargar} tintColor={C.orange} />}>
        <View style={styles.header}><View><Text style={styles.eyebrow}>SABORES PARA COMPARTIR</Text><Text style={styles.title}>Nuestra carta</Text></View><View style={styles.icon}><Ionicons name="restaurant" size={20} color={C.orange} /></View></View>
        <View style={styles.hero}><Text style={styles.badge}>KONYS PIZZA</Text><Text style={styles.heroTitle}>Sabores para compartir.</Text><Text style={styles.heroBody}>Descubre la carta de Konys Pizza y encuentra tu próximo favorito.</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {CATEGORIAS.map((item) => <Pressable key={item.id} onPress={() => setCategoria(item.id)} style={[styles.chip, categoria === item.id && styles.chipActive]}><Text style={[styles.chipText, categoria === item.id && styles.chipTextActive]}>{item.label}</Text></Pressable>)}
        </ScrollView>
        {loading && platos.length === 0 ? <ActivityIndicator color={C.orange} style={{ marginTop: 32 }} /> : null}
        {error ? <Pressable style={styles.message} onPress={cargar}><Ionicons name="refresh" size={17} color={C.orange} /><Text style={styles.muted}>{error}</Text></Pressable> : null}
        {!loading && !error && visibles.length === 0 ? <View style={styles.empty}><Ionicons name="pizza-outline" size={32} color={C.orange} /><Text style={styles.emptyTitle}>Pronto tendremos novedades</Text><Text style={styles.muted}>Aún no hay platos visibles en esta categoría.</Text></View> : null}
        {visibles.map((plato) => <MenuCard key={plato.id} plato={plato} C={C} styles={styles} />)}
        <AppFooter />
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuCard({ plato, C, styles }) {
  return <View style={styles.card}>
    {plato.foto_url ? <Image source={{ uri: plato.foto_url }} style={styles.photo} resizeMode="cover" /> : <View style={styles.photoPlaceholder}><Ionicons name="pizza" size={32} color={C.orange} /></View>}
    <View style={styles.cardBody}><View style={styles.cardHeading}><Text style={styles.dishName}>{plato.nombre}</Text>{plato.precio != null ? <Text style={styles.price}>{dineroCOP(plato.precio)}</Text> : null}</View>
      <Text style={styles.category}>{String(plato.categoria || '').toUpperCase()}</Text>
      {plato.descripcion ? <Text style={styles.description}>{plato.descripcion}</Text> : null}
    </View>
  </View>;
}

const createStyles = (C) => StyleSheet.create({ safe: { flex: 1, backgroundColor: C.cream }, content: { padding: 16, paddingBottom: 26 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }, eyebrow: { color: C.orange, fontSize: 9, fontWeight: '900', letterSpacing: 1 }, title: { color: C.ink, fontSize: 23, fontWeight: '900', marginTop: 4 }, icon: { width: 40, height: 40, borderRadius: 13, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center' },
  hero: { backgroundColor: C.hero, borderRadius: 20, padding: 18 }, badge: { alignSelf: 'flex-start', color: C.badgeText, fontSize: 9, fontWeight: '900' }, heroTitle: { color: C.white, fontSize: 19, fontWeight: '900', marginTop: 12 }, heroBody: { color: C.heroBody, fontSize: 11, lineHeight: 16, marginTop: 5 },
  chips: { gap: 7, paddingVertical: 15 }, chip: { borderRadius: 15, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, paddingHorizontal: 12, paddingVertical: 8 }, chipActive: { backgroundColor: C.orange, borderColor: C.orange }, chipText: { color: C.muted, fontSize: 10, fontWeight: '700' }, chipTextActive: { color: C.orangeText },
  card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 15, marginBottom: 11, overflow: 'hidden', elevation: 1 }, photo: { width: '100%', height: 142, backgroundColor: C.photoBg }, photoPlaceholder: { height: 90, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center' }, cardBody: { padding: 13 }, cardHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 }, dishName: { flex: 1, color: C.ink, fontSize: 13, fontWeight: '900' }, price: { color: C.orange, fontSize: 11, fontWeight: '900' }, category: { color: C.orange, fontSize: 8, fontWeight: '900', marginTop: 5 }, description: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 5 },
  empty: { backgroundColor: C.surface, borderRadius: 15, padding: 25, alignItems: 'center', gap: 7 }, emptyTitle: { color: C.ink, fontSize: 13, fontWeight: '800', marginTop: 4 }, muted: { flex: 1, color: C.muted, fontSize: 11, lineHeight: 16 }, message: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 14 },
});
