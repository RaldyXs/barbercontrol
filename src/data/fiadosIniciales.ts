import { Fiado } from '../types';
import { getFechaHoyLocal } from '../utils/formatters';

export function getFiadosDemoIniciales(): Fiado[] {
  const hoy = getFechaHoyLocal();

  return [
    {
      id: 'fiado-1',
      clienteNombre: 'Manuel Tejada',
      clienteTelefono: '8095558899',
      montoRD: 450,
      concepto: 'Degradado / Fade Moderno',
      fecha: hoy,
      saldado: false,
      notas: 'Avisó que pasa a pagar el sábado',
    },
    {
      id: 'fiado-2',
      clienteNombre: 'Rafael Pineda',
      clienteTelefono: '8294441188',
      montoRD: 250,
      concepto: 'Perfilado de Barba',
      fecha: hoy,
      saldado: false,
      notas: 'Quedó corto de cambio',
    },
    {
      id: 'fiado-3',
      clienteNombre: 'Domingo Cruz',
      clienteTelefono: '8493332211',
      montoRD: 350,
      concepto: 'Corte Clásico',
      fecha: hoy,
      saldado: true,
      notas: 'Pagado por transferencia',
    },
  ];
}
