import { Cita } from '../types';
import { getFechaHoyLocal } from '../utils/formatters';

export function getCitasDemoIniciales(): Cita[] {
  const hoy = getFechaHoyLocal();

  // Calcular fechas de ayer y mañana para simular historial y agenda semanal
  const hoyDate = new Date();
  
  const mananaDate = new Date(hoyDate);
  mananaDate.setDate(hoyDate.getDate() + 1);
  const manana = mananaDate.toISOString().split('T')[0];

  const pasadoDate = new Date(hoyDate);
  pasadoDate.setDate(hoyDate.getDate() + 2);
  const pasado = pasadoDate.toISOString().split('T')[0];

  return [
    // --- HOY: Citas ya atendidas (aportan a la caja) ---
    {
      id: 'cita-1',
      clienteNombre: 'Juan Carlos Rosario',
      clienteTelefono: '8095551234',
      servicioId: 'degradado-fade',
      fecha: hoy,
      hora: '09:00',
      duracionMinutos: 40,
      precioCobradoRD: 450,
      estado: 'atendido',
      notas: 'Fade medio con navaja',
      creadoEn: new Date().toISOString(),
    },
    {
      id: 'cita-2',
      clienteNombre: 'Kelvin Mercedes',
      clienteTelefono: '8293334567',
      servicioId: 'combo-completo',
      fecha: hoy,
      hora: '10:00',
      duracionMinutos: 50,
      precioCobradoRD: 650,
      estado: 'atendido',
      notas: 'Barba bien delineada con toalla',
      creadoEn: new Date().toISOString(),
    },
    {
      id: 'cita-3',
      clienteNombre: 'Moisés Santana',
      clienteTelefono: '8492227890',
      servicioId: 'corte-clasico',
      fecha: hoy,
      hora: '11:15',
      duracionMinutos: 30,
      precioCobradoRD: 350,
      estado: 'atendido',
      creadoEn: new Date().toISOString(),
    },

    // --- HOY: Citas pendientes para el resto del día ---
    {
      id: 'cita-4',
      clienteNombre: 'Edwin Almonte',
      clienteTelefono: '8094448822',
      servicioId: 'degradado-fade',
      fecha: hoy,
      hora: '14:30',
      duracionMinutos: 40,
      precioCobradoRD: 450,
      estado: 'en_atencion',
      notas: 'En el sillón recortándose',
      creadoEn: new Date().toISOString(),
    },
    {
      id: 'cita-5',
      clienteNombre: 'Nelson De La Cruz',
      clienteTelefono: '8298889911',
      servicioId: 'perfilado-barba',
      fecha: hoy,
      hora: '15:30',
      duracionMinutos: 25,
      precioCobradoRD: 250,
      estado: 'pendiente',
      creadoEn: new Date().toISOString(),
    },
    {
      id: 'cita-6',
      clienteNombre: 'Carlos ' + 'Guerrero',
      clienteTelefono: '8097773344',
      servicioId: 'combo-completo',
      fecha: hoy,
      hora: '16:30',
      duracionMinutos: 50,
      precioCobradoRD: 650,
      estado: 'pendiente',
      notas: 'Cita reservada por WhatsApp',
      creadoEn: new Date().toISOString(),
    },
    {
      id: 'cita-7',
      clienteNombre: 'Junior Bautista',
      clienteTelefono: '8491114455',
      servicioId: 'corte-infantil',
      fecha: hoy,
      hora: '17:45',
      duracionMinutos: 25,
      precioCobradoRD: 300,
      estado: 'no_asistio',
      notas: 'Avisó que no pudo llegar a tiempo',
      creadoEn: new Date().toISOString(),
    },

    // --- MAÑANA: Citas programadas ---
    {
      id: 'cita-8',
      clienteNombre: 'Pedro Martínez',
      clienteTelefono: '8096667788',
      servicioId: 'degradado-fade',
      fecha: manana,
      hora: '10:00',
      duracionMinutos: 40,
      precioCobradoRD: 450,
      estado: 'pendiente',
      creadoEn: new Date().toISOString(),
    },
    {
      id: 'cita-9',
      clienteNombre: 'Luis Fernández',
      clienteTelefono: '8294441122',
      servicioId: 'combo-completo',
      fecha: manana,
      hora: '11:00',
      duracionMinutos: 50,
      precioCobradoRD: 650,
      estado: 'pendiente',
      creadoEn: new Date().toISOString(),
    },

    // --- PASADO MAÑANA ---
    {
      id: 'cita-10',
      clienteNombre: 'Reynaldo Gómez',
      clienteTelefono: '8499990011',
      servicioId: 'corte-clasico',
      fecha: pasado,
      hora: '15:00',
      duracionMinutos: 30,
      precioCobradoRD: 350,
      estado: 'pendiente',
      creadoEn: new Date().toISOString(),
    },
  ];
}
