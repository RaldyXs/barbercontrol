import { Servicio } from '../types';

export const SERVICIOS_INICIALES: Servicio[] = [
  {
    id: 'corte-clasico',
    nombre: 'Corte Clásico / Tradicional',
    precioRD: 350,
    duracionMinutos: 30,
    descripcion: 'Tijera o máquina tradicional con acabado limpio de cuello.',
  },
  {
    id: 'degradado-fade',
    nombre: 'Degradado / Fade Moderno',
    precioRD: 450,
    duracionMinutos: 40,
    descripcion: 'Low, Mid o High fade con navaja y cerquillos perfilados.',
  },
  {
    id: 'perfilado-barba',
    nombre: 'Arreglo & Perfilado de Barba',
    precioRD: 250,
    duracionMinutos: 25,
    descripcion: 'Rebaje, delineado a navaja, toalla caliente y aceites.',
  },
  {
    id: 'combo-completo',
    nombre: 'Combo Completo: Corte + Barba',
    precioRD: 650,
    duracionMinutos: 50,
    descripcion: 'Corte completo a gusto + tratamiento de barba y toalla.',
  },
  {
    id: 'corte-infantil',
    nombre: 'Corte Infantil (Niños)',
    precioRD: 300,
    duracionMinutos: 25,
    descripcion: 'Corte para niños con paciencia y detalle.',
  },
  {
    id: 'cejas-blackmask',
    nombre: 'Cejas & Black Mask (Puntos Negros)',
    precioRD: 200,
    duracionMinutos: 15,
    descripcion: 'Limpieza facial rápida y diseño de cejas a navaja.',
  },
];
