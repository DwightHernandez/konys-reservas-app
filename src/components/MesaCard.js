// components/MesaCard.js
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../constants/theme';

export default function MesaCard({ mesa, onReservar }) {
  const colors = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.card, !mesa.activa && styles.inactive]}>
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{mesa.nombre}</Text>
        <Text style={styles.subtitle}><Ionicons name="location-outline" size={14} color={colors.muted} /> Zona: {mesa.zona}</Text>
        <Text style={styles.subtitle}><Ionicons name="people-outline" size={14} color={colors.muted} /> Capacidad: {mesa.capacidad} personas</Text>
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

const createStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
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
    color: colors.ink,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 2,
  },
  button: {
    backgroundColor: colors.orange,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
  },
  buttonDisabled: {
    backgroundColor: colors.disabled,
  },
  buttonText: {
    color: colors.orangeText,
    fontWeight: 'bold',
  },
  inactive: { opacity: 0.55 },
});
