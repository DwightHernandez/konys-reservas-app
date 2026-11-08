// components/MesaCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MesaCard({ mesa, onReservar }) {
  return (
    <View style={styles.card}>
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{mesa.nombre}</Text>
        <Text style={styles.subtitle}>
          <Ionicons name="location-outline" size={14} /> Zona: {mesa.zona}
        </Text>
        <Text style={styles.subtitle}>
          <Ionicons name="people-outline" size={14} /> Capacidad: {mesa.capacidad} personas
        </Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.button, !mesa.activa && styles.buttonDisabled]} 
        onPress={() => onReservar(mesa)}
        disabled={!mesa.activa}
      >
        <Text style={styles.buttonText}>
          {mesa.activa ? 'Reservar' : 'Inactiva'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3, // Sombra en Android
    shadowColor: '#000', // Sombra en iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F2B3D',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  button: {
    backgroundColor: '#F28C28',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});