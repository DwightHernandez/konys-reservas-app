// app/(tabs)/index.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';

// Paleta de colores basada en tu Figma
const Colors = {
  primary: '#3A1810', // Café oscuro del hero
  accent: '#F38020', // Naranja de los botones
  background: '#F5F5F5',
  cardBg: '#FFFFFF',
  text: '#333333',
  textMuted: '#888888'
};

export default function InicioScreen() {
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const router = useRouter();

  const fetchMesas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('mesas')
      .select('*')
      .order('nombre');

    if (!error && data) {
      setMesas(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMesas();
  }, []);

  const handleContinuar = () => {
    if (mesaSeleccionada) {
      router.push(`/reservar/${mesaSeleccionada}`);
    }
  };

  if (loading && mesas.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchMesas} colors={[Colors.accent]} />}
      >
        {/* Header superior */}
        <View style={styles.header}>
          <View style={styles.logoCircle}></View>
          <View>
            <Text style={styles.headerTitle}>KONYS PIZZA</Text>
            <Text style={styles.headerSubtitle}>La pizza más icónica</Text>
          </View>
        </View>

        {/* Tarjeta Hero (Café oscuro) */}
        <View style={styles.heroCard}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>RESERVAS • BUCARAMANGA</Text>
          </View>
          <Text style={styles.heroTitle}>Una mesa te espera.</Text>
          <Text style={styles.heroText}>Reserva en pocos pasos y disfruta tu visita a Konys Pizza.</Text>
          
          <View style={styles.heroImageContainer}>
            <View style={styles.pizzaMockIcon}></View>
            <Text style={styles.heroImageText}>RECIÉN HORNEADA</Text>
          </View>
        </View>

        {/* Tarjeta de Horarios */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Horarios de atención</Text>
          <View style={styles.horarioRow}>
            <Ionicons name="sunny" size={16} color={Colors.accent} />
            <Text style={styles.horarioText}>Almuerzo   12:30 – 2:30 p. m.</Text>
          </View>
          <View style={styles.horarioRow}>
            <Ionicons name="moon" size={16} color={Colors.textMuted} />
            <Text style={styles.horarioText}>Noche        5:00 – 11:00 p. m.</Text>
          </View>
        </View>

        {/* Tarjeta de Mesas */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mesas disponibles</Text>
          {mesas.map((mesa) => (
            <TouchableOpacity 
              key={mesa.id} 
              style={[
                styles.mesaItem, 
                mesaSeleccionada === mesa.id && styles.mesaItemSelected,
                !mesa.activa && styles.mesaItemDisabled
              ]}
              onPress={() => mesa.activa && setMesaSeleccionada(mesa.id)}
              disabled={!mesa.activa}
            >
              <Text style={[styles.mesaItemText, !mesa.activa && styles.mesaItemTextDisabled]}>
                {mesa.nombre} · {mesa.zona} · {mesa.capacidad} personas · {mesa.activa ? 'Disponible' : 'Inactiva'}
              </Text>
            </TouchableOpacity>
          ))}
          {mesas.length === 0 && <Text style={styles.emptyText}>No hay mesas configuradas.</Text>}
        </View>
      </ScrollView>

      {/* Botón inferior fijo */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.mainButton, !mesaSeleccionada && styles.mainButtonDisabled]}
          onPress={handleContinuar}
          disabled={!mesaSeleccionada}
        >
          <Text style={styles.mainButtonText}>Reservar mesa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Espacio para el botón fijo
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  heroCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 15,
  },
  badgeText: {
    color: '#4CB9E7', // Color azulado del mockup
    fontSize: 10,
    fontWeight: 'bold',
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  heroText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 20,
  },
  heroImageContainer: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pizzaMockIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8D4B4',
    marginRight: 15,
  },
  heroImageText: {
    color: Colors.accent,
    fontWeight: 'bold',
    fontSize: 12,
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 15,
  },
  horarioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  horarioText: {
    marginLeft: 10,
    fontSize: 14,
    color: Colors.text,
  },
  mesaItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  mesaItemSelected: {
    backgroundColor: 'rgba(243, 128, 32, 0.1)', // Fondo naranjita al seleccionar
    borderRadius: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 0,
  },
  mesaItemDisabled: {
    opacity: 0.5,
  },
  mesaItemText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  mesaItemTextDisabled: {
    textDecorationLine: 'line-through',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  mainButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  mainButtonDisabled: {
    backgroundColor: '#CCC',
  },
  mainButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 
