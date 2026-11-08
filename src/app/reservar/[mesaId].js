// src/app/reservar/[mesaId].js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';

const Colors = {
  primary: '#3A1810',
  accent: '#F38020',
  background: '#F5F5F5',
  cardBg: '#FFFFFF',
  text: '#333333',
  textMuted: '#888888',
  border: '#DDDDDD'
};

// Generar los próximos 7 días para el selector
const generarDias = () => {
  const dias = [];
  const nombresDias = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
  for (let i = 0; i < 7; i++) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + i);
    dias.push({
      fecha Completa: fecha.toISOString().split('T')[0],
      diaNombre: nombresDias[fecha.getDay()],
      diaNumero: fecha.getDate().toString()
    });
  }
  return dias;
};

const slotsAlmuerzo = ['12:30', '13:30', '14:30'];
const slotsNoche = ['17:00', '18:00', '19:00', '20:00', '21:00'];

export default function ReservarScreen() {
  const { mesaId } = useLocalSearchParams();
  const router = useRouter();
  
  const [mesa, setMesa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [fechas] = useState(generarDias());
  
  // Estado del formulario
  const [fechaSeleccionada, setFechaSeleccionada] = useState(fechas[0].fechaCompleta);
  const [horaSeleccionada, setHoraSeleccionada] = useState(null);
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [personas, setPersonas] = useState('2');

  // Cargar detalles de la mesa
  useEffect(() => {
    const fetchMesa = async () => {
      const { data, error } = await supabase
        .from('mesas')
        .select('*')
        .eq('id', mesaId)
        .single();
        
      if (!error && data) setMesa(data);
      setLoading(false);
    };
    fetchMesa();
  }, [mesaId]);

  const handleConfirmar = async () => {
    if (!horaSeleccionada || !nombre || !personas) {
      Alert.alert('Faltan datos', 'Por favor selecciona la hora, ingresa tu nombre y el número de personas.');
      return;
    }

    if (parseInt(personas) > mesa.capacidad) {
      Alert.alert('Capacidad excedida', `Esta mesa es para máximo ${mesa.capacidad} personas.`);
      return;
    }

    setGuardando(true);
    // Calcular hora de fin (1 hora de duración)
    const horaInicio = `${horaSeleccionada}:00`;
    const [h, m] = horaSeleccionada.split(':');
    const horaFin = `${parseInt(h) + 1}:${m}:00`;

    const { error } = await supabase
      .from('reservas')
      .insert([
        {
          mesa_id: mesa.id,
          cliente_nombre: nombre,
          cliente_contacto: contacto,
          num_personas: parseInt(personas),
          fecha: fechaSeleccionada,
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          estado: 'confirmada'
        }
      ]);

    setGuardando(false);

    if (error) {
      Alert.alert('Error', 'Hubo un problema al guardar la reserva.');
      console.error(error);
    } else {
      Alert.alert('¡Éxito!', 'Tu mesa está reservada.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    }
  };

  if (loading || !mesa) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Botón Volver */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Elige tu momento.</Text>
          <Text style={styles.heroText}>Selecciona la fecha y un horario disponible.</Text>
          <View style={styles.mesaInfoBadge}>
            <Text style={styles.mesaInfoText}>
              {mesa.nombre} · {mesa.zona} · Capacidad máxima: {mesa.capacidad} personas
            </Text>
          </View>
        </View>

        {/* Selector de Fechas */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fechasContainer}>
          {fechas.map((item) => {
            const isSelected = fechaSeleccionada === item.fechaCompleta;
            return (
              <TouchableOpacity
                key={item.fechaCompleta}
                style={[styles.fechaItem, isSelected && styles.fechaItemSelected]}
                onPress={() => setFechaSeleccionada(item.fechaCompleta)}
              >
                <Text style={[styles.fechaDia, isSelected && styles.fechaTextoSelected]}>{item.diaNombre}</Text>
                <Text style={[styles.fechaNum, isSelected && styles.fechaTextoSelected]}>{item.diaNumero}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Horarios Almuerzo */}
        <Text style={styles.sectionTitle}>ALMUERZO • 12:30 – 2:30 p. m.</Text>
        <View style={styles.slotsContainer}>
          {slotsAlmuerzo.map(slot => (
            <TouchableOpacity 
              key={slot} 
              style={[styles.slotItem, horaSeleccionada === slot && styles.slotSelected]}
              onPress={() => setHoraSeleccionada(slot)}
            >
              <Text style={[styles.slotText, horaSeleccionada === slot && styles.slotTextSelected]}>{slot}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Horarios Noche */}
        <Text style={styles.sectionTitle}>NOCHE • 5:00 – 11:00 p. m.</Text>
        <View style={styles.slotsContainer}>
          {slotsNoche.map(slot => (
            <TouchableOpacity 
              key={slot} 
              style={[styles.slotItem, horaSeleccionada === slot && styles.slotSelected]}
              onPress={() => setHoraSeleccionada(slot)}
            >
              <Text style={[styles.slotText, horaSeleccionada === slot && styles.slotTextSelected]}>{slot}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Formulario */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>COMPLETA TUS DATOS</Text>
          
          <Text style={styles.label}>Nombre completo</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Ej. María Rodríguez" 
            value={nombre}
            onChangeText={setNombre}
          />

          <Text style={styles.label}>Número de contacto (Opcional)</Text>
          <TextInput 
            style={styles.input} 
            placeholder="300 000 0000" 
            keyboardType="phone-pad"
            value={contacto}
            onChangeText={setContacto}
          />

          <Text style={styles.label}>Número de personas</Text>
          <TextInput 
            style={styles.input} 
            keyboardType="numeric"
            value={personas}
            onChangeText={setPersonas}
          />
          <Text style={styles.helperText}>Máximo {mesa.capacidad} personas para esta mesa.</Text>
        </View>
      </ScrollView>

      {/* Botón fijo inferior */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.mainButton, guardando && styles.mainButtonDisabled]}
          onPress={handleConfirmar}
          disabled={guardando}
        >
          {guardando ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.mainButtonText}>Confirmar reserva</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backText: { fontSize: 16, marginLeft: 5, color: Colors.text },
  heroCard: { backgroundColor: Colors.primary, borderRadius: 16, padding: 20, marginBottom: 20 },
  heroTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  heroText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 20 },
  mesaInfoBadge: { backgroundColor: 'rgba(255,255,255,0.9)', padding: 12, borderRadius: 8 },
  mesaInfoText: { color: Colors.primary, fontWeight: 'bold', fontSize: 13 },
  fechasContainer: { flexDirection: 'row', marginBottom: 25 },
  fechaItem: { backgroundColor: Colors.cardBg, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginRight: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  fechaItemSelected: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  fechaDia: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  fechaNum: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  fechaTextoSelected: { color: '#FFF' },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: Colors.textMuted, marginBottom: 12, marginTop: 10, textTransform: 'uppercase' },
  slotsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
  slotItem: { backgroundColor: Colors.cardBg, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, marginRight: 10, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  slotSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  slotText: { color: Colors.text, fontSize: 14 },
  slotTextSelected: { color: '#FFF', fontWeight: 'bold' },
  formContainer: { marginTop: 10, backgroundColor: Colors.cardBg, padding: 20, borderRadius: 16 },
  label: { fontSize: 13, fontWeight: 'bold', color: Colors.text, marginBottom: 8, marginTop: 15 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, fontSize: 15, backgroundColor: Colors.background },
  helperText: { fontSize: 11, color: Colors.textMuted, marginTop: 5 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.background, padding: 20, borderTopWidth: 1, borderTopColor: Colors.border },
  mainButton: { backgroundColor: Colors.accent, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  mainButtonDisabled: { opacity: 0.7 },
  mainButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});