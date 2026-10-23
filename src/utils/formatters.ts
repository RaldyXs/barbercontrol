import { Fiado, MovimientoFiado } from '../types';

// Formato estándar de Pesos Dominicanos (RD$ 1,250.00)
export function formatearMonedaRD(monto: number): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(monto).replace('DOP', 'RD$');
}

// Obtener fecha de hoy en formato YYYY-MM-DD local
export function getFechaHoyLocal(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Obtener hora actual en formato HH:mm local
export function getHoraActual(): string {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// Formatear fecha para lectura humana (ej: "Viernes, 9 de Octubre")
export function formatearFechaHumana(fechaStr: string): string {
  if (!fechaStr || typeof fechaStr !== 'string') return '';
  const parts = fechaStr.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return fechaStr;
  }
  const [year, month, day] = parts;
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('es-DO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

// Formatear hora de 24h a 12h con AM/PM (ej: "14:30" -> "2:30 PM")
export function formatearHora12(hora24: string): string {
  if (!hora24 || typeof hora24 !== 'string') return '';
  const parts = hora24.split(':');
  if (parts.length < 2) return hora24;
  const [hStr, mStr] = parts;
  let h = parseInt(hStr, 10);
  if (isNaN(h)) return hora24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${mStr} ${ampm}`;
}

// Convertir hora "HH:mm" a minutos totales del día
export function horaAMinutos(hora24: string): number {
  if (!hora24) return 0;
  const [h, m] = hora24.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Sumar minutos a una hora y devolver "HH:mm"
export function sumarMinutosAHora(hora24: string, minutos: number): string {
  const totalMin = horaAMinutos(hora24) + minutos;
  const h = Math.floor(totalMin / 60) % 24;
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Detectar si dos rangos de horas se solapan
export function haySolapamiento(
  horaInicioA: string,
  duracionA: number,
  horaInicioB: string,
  duracionB: number
): boolean {
  const iniA = horaAMinutos(horaInicioA);
  const finA = iniA + duracionA;
  const iniB = horaAMinutos(horaInicioB);
  const finB = iniB + duracionB;

  return iniA < finB && finA > iniB;
}

// Generar mensaje para abrir WhatsApp
export function generarEnlaceWhatsApp(telefono: string, clienteNombre: string, servicioNombre: string, hora: string): string {
  const cleanPhone = telefono.replace(/\D/g, '');
  const hora12 = formatearHora12(hora);
  const mensaje = encodeURIComponent(
    `¡Hola ${clienteNombre}! 👋 Te recordamos tu cita de *${servicioNombre}* para hoy a las *${hora12}* en la barbería. 💈 ¡Te esperamos!`
  );
  return `https://wa.me/${cleanPhone.length === 10 ? '1' + cleanPhone : cleanPhone}?text=${mensaje}`;
}

// Formatear fecha corta legible (ej: "23 oct 2026")
export function formatearFechaCorta(fechaStr: string): string {
  if (!fechaStr || typeof fechaStr !== 'string') return '';
  const parts = fechaStr.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return fechaStr;
  }
  const [year, month, day] = parts;
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('es-DO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// Normalizar texto para comparaciones sin importar mayúsculas, minúsculas o acentos (ej. "Cabezón" === "cabezon")
export function normalizarTexto(texto: string): string {
  if (!texto || typeof texto !== 'string') return '';
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Obtener o reconstruir el historial general de movimientos (cargos y abonos) de una cuenta
export function obtenerMovimientosFiado(fiado: Fiado): MovimientoFiado[] {
  if (Array.isArray(fiado.movimientos) && fiado.movimientos.length > 0) {
    return fiado.movimientos;
  }

  // Retrocompatibilidad automática si aún no tiene array de movimientos
  const lista: MovimientoFiado[] = [];
  const totalAbonado = fiado.abonos?.reduce((sum, a) => sum + (a.montoRD || 0), 0) || 0;
  const deudaInicial = fiado.montoOriginalRD ?? (fiado.montoRD + totalAbonado);

  lista.push({
    id: `cargo-init-${fiado.id}`,
    tipo: 'cargo',
    montoRD: deudaInicial,
    concepto: fiado.concepto || 'Apertura de cuenta',
    fecha: fiado.fecha || getFechaHoyLocal(),
    creadoEn: fiado.fecha ? `${fiado.fecha}T00:00:00.000Z` : new Date().toISOString(),
    notas: fiado.notas,
  });

  if (Array.isArray(fiado.abonos)) {
    fiado.abonos.forEach((a) => {
      lista.push({
        id: a.id,
        tipo: 'abono',
        montoRD: a.montoRD,
        fecha: a.fecha,
        creadoEn: a.creadoEn,
        notas: a.notas,
      });
    });
  }

  return lista;
}
