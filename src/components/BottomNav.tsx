import React from 'react';
import { useAgenda } from '../context/AgendaContext';
import { VistaActiva } from '../types';
import { Calendar, CalendarRange, Wallet, Scissors } from 'lucide-react';
import { getFechaHoyLocal } from '../utils/formatters';

export const BottomNav: React.FC = () => {
  const { vistaActiva, setVistaActiva, citas } = useAgenda();
  const hoy = getFechaHoyLocal();

  const citasSeguras = Array.isArray(citas) ? citas : [];
  const pendientesHoy = citasSeguras.filter(
    (c) => c && c.fecha === hoy && (c.estado === 'pendiente' || c.estado === 'en_atencion')
  ).length;

  const navItems: { id: VistaActiva; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'hoy',
      label: 'Mi Panel',
      icon: <Calendar className="w-4 h-4 stroke-[2]" />,
      badge: pendientesHoy,
    },
    {
      id: 'semana',
      label: 'Calendario',
      icon: <CalendarRange className="w-4 h-4 stroke-[2]" />,
    },
    {
      id: 'caja',
      label: 'Caja & Fiados',
      icon: <Wallet className="w-4 h-4 stroke-[2]" />,
    },
    {
      id: 'servicios',
      label: 'Tarifas',
      icon: <Scissors className="w-4 h-4 stroke-[2]" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-xl border-t border-stone-200/80 px-2 py-2 max-w-lg mx-auto shadow-lg">
      <div className="grid grid-cols-4 gap-1">
        {navItems.map((item) => {
          const isActive = vistaActiva === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setVistaActiva(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-amber-900 font-bold bg-amber-100/60'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <div className="relative flex items-center justify-center">
                {item.icon}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-amber-800 text-white font-bold text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
