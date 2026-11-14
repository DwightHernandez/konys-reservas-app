import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

const C = { ink: '#351510', orange: '#F58A24', cream: '#F7F5F2', muted: '#727982', line: '#E9E4DE', white: '#FFFFFF', green: '#3C9A62' };

export default function ConfirmacionScreen() {
  const { mesa, zona, fecha, hora, personas, nombre } = useLocalSearchParams();
  const formattedDate = fecha ? new Date(`${fecha}T12:00:00`).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.badge}>RESERVAS · BUCARAMANGA</Text>
          <View style={styles.check}><Ionicons name="checkmark" size={32} color={C.white} /></View>
          <Text style={styles.title}>¡Tu mesa está reservada!</Text>
          <Text style={styles.subtitle}>En Konys Pizza te esperamos.</Text>
        </View>
        <View style={styles.receipt}>
          <View style={styles.receiptHeader}><Ionicons name="receipt-outline" size={19} color={C.orange} /><Text style={styles.receiptTitle}>COMPROBANTE DE RESERVA</Text></View>
          <Text style={styles.confirmed}><Ionicons name="checkmark-circle" size={14} color={C.green} />  RESERVA CONFIRMADA</Text>
          <Row label="Cliente" value={nombre} />
          <Row label="Mesa" value={`${mesa || ''} · ${zona || ''}`} />
          <Row label="Fecha" value={formattedDate} />
          <Row label="Hora" value={hora} />
          <Row label="Personas" value={personas ? `${personas} personas` : ''} />
          <View style={styles.dash} />
          <Text style={styles.note}>Te recomendamos llegar unos minutos antes. ¡Gracias por elegirnos!</Text>
        </View>
        <Pressable style={styles.button} onPress={() => router.replace('/tabs')}><Text style={styles.buttonText}>Volver al inicio</Text><Ionicons name="arrow-forward" size={17} color={C.white} /></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }) {
  return <View style={styles.row}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value || '—'}</Text></View>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: C.cream }, content: { flexGrow: 1, padding: 16, justifyContent: 'center' },
  hero: { backgroundColor: C.ink, padding: 19, borderRadius: 20, alignItems: 'center' }, badge: { color: '#FFD18D', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 }, check: { width: 58, height: 58, borderRadius: 29, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', marginTop: 20 }, title: { color: C.white, fontSize: 20, fontWeight: '900', textAlign: 'center', marginTop: 12 }, subtitle: { color: '#E6D9D5', fontSize: 12, marginTop: 5 },
  receipt: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 17, padding: 16, marginTop: 14 }, receiptHeader: { flexDirection: 'row', gap: 8, alignItems: 'center' }, receiptTitle: { color: C.ink, fontSize: 11, fontWeight: '900', letterSpacing: 0.4 }, confirmed: { color: C.green, fontSize: 9, fontWeight: '900', marginTop: 17, marginBottom: 7 }, row: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F2EFEB' }, label: { color: C.muted, fontSize: 11, width: 78 }, value: { color: C.ink, fontSize: 11, fontWeight: '700', flex: 1, textTransform: 'capitalize' }, dash: { borderTopWidth: 1, borderStyle: 'dashed', borderColor: C.line, marginTop: 12 }, note: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 11 },
  button: { backgroundColor: C.orange, borderRadius: 12, marginTop: 16, paddingVertical: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }, buttonText: { color: C.white, fontSize: 13, fontWeight: '900' },
});
