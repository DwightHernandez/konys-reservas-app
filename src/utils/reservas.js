export const DIAS_SEMANA = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
];

export const JORNADAS_DEFAULT = [
  { jornada: 'almuerzo', hora_inicio: '12:30', hora_fin: '14:30', duracion_slot: 60 },
  { jornada: 'noche', hora_inicio: '17:00', hora_fin: '23:00', duracion_slot: 60 },
];

export function fechaLocalISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function horaAMinutos(value) {
  if (!value) return 0;
  const [hours = '0', minutes = '0'] = String(value).split(':');
  return Number(hours) * 60 + Number(minutes);
}

export function minutosAHora(value) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function generarSlots(horarios, reservas = []) {
  const slots = [];
  (horarios || []).filter((horario) => horario.activo !== false).forEach((horario) => {
    const inicio = horaAMinutos(horario.hora_inicio);
    const fin = horaAMinutos(horario.hora_fin);
    const duracion = Math.max(15, Number(horario.duracion_slot) || 60);
    for (let minuto = inicio; minuto + duracion <= fin; minuto += duracion) {
      const hora = minutosAHora(minuto);
      const ocupado = reservas.some((reserva) => {
        if (reserva.estado === 'cancelada') return false;
        const reservaInicio = horaAMinutos(reserva.hora_inicio);
        const reservaFin = horaAMinutos(reserva.hora_fin) || reservaInicio + duracion;
        return minuto < reservaFin && minuto + duracion > reservaInicio;
      });
      slots.push({ hora, jornada: horario.jornada, ocupado });
    }
  });
  return slots;
}

export function etiquetaFecha(date) {
  return {
    dia: date.toLocaleDateString('es-CO', { weekday: 'short' }).replace('.', '').toUpperCase(),
    numero: String(date.getDate()),
    fecha: fechaLocalISO(date),
  };
}

export function dineroCOP(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}
