'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Button from '@/components/ui/Button';
import {
  obtenerRegistrosPorFecha,
  fechaHoy,
  type RegistroDiario,
} from '@/lib/db';

/* ════════════════════════════════════════════════════════════════
   CONSTANTES
   ════════════════════════════════════════════════════════════════ */

const CHECKS_KEY = 'protocolo-checks';

function todayStr() { return new Date().toISOString().slice(0, 10); }

function getChecksForDate(date: string): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const p = JSON.parse(localStorage.getItem(CHECKS_KEY) || '{}');
    if (p._date === date) {
      const { _date, ...rest } = p;
      return rest;
    }
    return {};
  } catch { return {}; }
}

function formatDate(d: string) {
  const dt = new Date(d + 'T12:00:00');
  return dt.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function getLast7Days(today: string): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) days.push(addDays(today, -i));
  return days;
}

const SINTOMA_LABELS: Record<string, { label: string; positiveIsGood: boolean }> = {
  hinchazon:    { label: '🦶 Hinchazón pies/tobillos', positiveIsGood: false },
  tos:          { label: '😷 Tos excesiva',            positiveIsGood: false },
  disnea:       { label: '😮‍💨 Dificultad respirar',    positiveIsGood: false },
  manchas:      { label: '🟣 Manchas moradas nuevas',  positiveIsGood: false },
  flema_sangre: { label: '🩸 Flema con sangre',        positiveIsGood: false },
  mareo:        { label: '💫 Mareos o debilidad',       positiveIsGood: false },
  apetito:      { label: '🍽️ Comió bien',              positiveIsGood: true },
  sueno:        { label: '😴 Durmió bien',             positiveIsGood: true },
};

const TAREAS_PROTOCOLO: Record<string, string> = {
  d1: '🫁 Respiración Dorada',
  d2: '📋 Control de Signos Vitales',
  d3: '💊 Desayuno + Medicación AM',
  d4: '🫁 Respiración Diafragmática',
  d5: '🚶 Movilidad en Silla',
  n1: '🍽️ Almuerzo Cardiorrenal',
  n2: '😴 Siesta Obligatoria',
  n3: '🫁 Limpieza Bronquial',
  n4: '🚶 Caminata Terapéutica',
  c1: '🧘 Colación y Meditación',
  c2: '🍽️ Cena Ligera',
  c3: '📝 Registro de Síntomas',
  c4: '🫁 Respiración Labios Fruncidos',
  c5: '💊 Medicación de Noche',
};

/* ════════════════════════════════════════════════════════════════
   COMPONENTE
   ════════════════════════════════════════════════════════════════ */

export default function HistorialPage() {
  const [fecha, setFecha] = useState(fechaHoy());
  const [registros, setRegistros] = useState<RegistroDiario[]>([]);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const cargar = useCallback(async (f: string) => {
    setLoading(true);
    try {
      const regs = await obtenerRegistrosPorFecha(f);
      setRegistros(regs);
      setChecks(f === todayStr() ? getChecksForDate(f) : {});
    } catch {
      setRegistros([]);
      setChecks({});
    }
    setLoading(false);
  }, []);

  useEffect(() => { cargar(fecha); }, [fecha, cargar]);

  /* ── cálculos ── */
  const esHoy = fecha === todayStr();
  const signosVitales = registros.filter(r => r.tipo === 'cardiorrenal' && (r.datos as Record<string, unknown>)?.tipoRegistro === 'signos-protocolo');
  const sintomasRegs = registros.filter(r => r.tipo === 'mental' && (r.datos as Record<string, unknown>)?.tipoRegistro === 'sintomas-protocolo');
  const totalTareas = Object.keys(TAREAS_PROTOCOLO).length;
  const tareasHechas = Object.entries(checks).filter(([k, v]) => v && k in TAREAS_PROTOCOLO).length;
  const progreso = totalTareas > 0 ? Math.round((tareasHechas / totalTareas) * 100) : 0;
  const last7 = getLast7Days(todayStr());

  const irAnterior = () => setFecha(addDays(fecha, -1));
  const irSiguiente = () => { if (fecha < todayStr()) setFecha(addDays(fecha, 1)); };
  const toggle = (s: string) => setExpanded(expanded === s ? null : s);

  return (
    <>
      <Header titulo="📊 Historial" />

      <div className="p-4 space-y-4">

        {/* ── Navegación de fecha ── */}
        <div className="bg-white rounded-2xl p-4 border-2 border-gray-200 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <button onClick={irAnterior} className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl active:bg-gray-200" aria-label="Día anterior">◀</button>
            <div className="text-center flex-1">
              <p className="text-lg font-bold text-gray-800 capitalize">{formatDate(fecha)}</p>
              {esHoy && <span className="text-sm font-semibold text-green-600">HOY</span>}
            </div>
            <button onClick={irSiguiente} disabled={fecha >= todayStr()}
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${fecha >= todayStr() ? 'bg-gray-50 text-gray-300' : 'bg-gray-100 active:bg-gray-200'}`} aria-label="Día siguiente">▶</button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <span className="text-4xl animate-pulse">⏳</span>
            <p className="text-gray-500 mt-2">Cargando...</p>
          </div>
        ) : (
          <>
            {/* ── Mini semana ── */}
            <div className="bg-white rounded-2xl p-4 border-2 border-gray-200 shadow-sm">
              <h3 className="text-base font-bold text-gray-700 mb-3">Últimos 7 días</h3>
              <div className="flex justify-between gap-1">
                {last7.map(d => {
                  const sel = d === fecha;
                  const hoy = d === todayStr();
                  return (
                    <button key={d} onClick={() => setFecha(d)}
                      className={`flex-1 py-2 rounded-xl text-center transition-colors ${sel ? 'bg-green-600 text-white' : hoy ? 'bg-green-50 text-green-700 border border-green-300' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                      <p className="text-xs font-medium">{new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'narrow' })}</p>
                      <p className={`text-lg font-bold ${sel ? 'text-white' : ''}`}>{new Date(d + 'T12:00:00').getDate()}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Progreso protocolo (solo hoy) ── */}
            {esHoy && tareasHechas > 0 && (
              <div className="bg-white rounded-2xl p-5 border-2 border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-bold text-gray-800">📋 Protocolo de Hoy</h2>
                  <span className="text-2xl font-black text-green-600">{progreso}%</span>
                </div>
                <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div className="bg-green-500 h-full rounded-full transition-all duration-500" style={{ width: `${progreso}%` }} />
                </div>
                <p className="text-gray-500 text-sm mt-2">{tareasHechas} de {totalTareas} actividades</p>

                <button onClick={() => toggle('checks')} className="mt-3 text-blue-600 font-semibold text-sm">
                  {expanded === 'checks' ? '▲ Ocultar detalle' : '▶ Ver detalle'}
                </button>
                {expanded === 'checks' && (
                  <div className="mt-3 space-y-1.5">
                    {Object.entries(TAREAS_PROTOCOLO).map(([id, nombre]) => (
                      <div key={id} className="flex items-center gap-2">
                        <span className={`text-lg ${checks[id] ? '' : 'grayscale opacity-40'}`}>{checks[id] ? '✅' : '⬜'}</span>
                        <span className={`text-sm ${checks[id] ? 'text-gray-700' : 'text-gray-400'}`}>{nombre}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Signos Vitales ── */}
            {signosVitales.length > 0 && (
              <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm overflow-hidden">
                <button onClick={() => toggle('signos')} className="w-full flex items-center gap-3 p-4 text-left">
                  <span className="text-3xl">❤️</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">Signos Vitales</h3>
                    <p className="text-sm text-gray-500">{signosVitales.length} registro{signosVitales.length > 1 ? 's' : ''}</p>
                  </div>
                  <span className="text-xl text-gray-400">{expanded === 'signos' ? '▲' : '▼'}</span>
                </button>
                {expanded === 'signos' && (
                  <div className="px-4 pb-4 space-y-3">
                    {signosVitales.map((r, i) => {
                      const d = r.datos as Record<string, number>;
                      const hora = new Date(r.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                      return (
                        <div key={r.id ?? i} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <p className="text-xs text-gray-400 mb-3">🕐 {hora}</p>
                          <div className="grid grid-cols-2 gap-4">
                            {d.saturacion > 0 && (
                              <div className="text-center bg-white rounded-xl p-3 border border-gray-100">
                                <p className={`text-3xl font-black ${d.saturacion < 88 ? 'text-red-600' : d.saturacion < 92 ? 'text-amber-500' : 'text-green-600'}`}>{d.saturacion}<span className="text-lg">%</span></p>
                                <p className="text-xs text-gray-500 mt-1">🫁 Saturación</p>
                              </div>
                            )}
                            {d.pulso > 0 && (
                              <div className="text-center bg-white rounded-xl p-3 border border-gray-100">
                                <p className="text-3xl font-black text-blue-600">{d.pulso}</p>
                                <p className="text-xs text-gray-500 mt-1">💓 Pulso bpm</p>
                              </div>
                            )}
                            {(d.presionSis > 0 || d.presionDia > 0) && (
                              <div className="text-center bg-white rounded-xl p-3 border border-gray-100">
                                <p className="text-3xl font-black text-purple-600">{d.presionSis}<span className="text-lg text-gray-400">/</span>{d.presionDia}</p>
                                <p className="text-xs text-gray-500 mt-1">🩺 Presión mmHg</p>
                              </div>
                            )}
                            {d.peso > 0 && (
                              <div className="text-center bg-white rounded-xl p-3 border border-gray-100">
                                <p className="text-3xl font-black text-gray-700">{d.peso}<span className="text-lg text-gray-400">kg</span></p>
                                <p className="text-xs text-gray-500 mt-1">⚖️ Peso</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Síntomas ── */}
            {sintomasRegs.length > 0 && (
              <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm overflow-hidden">
                <button onClick={() => toggle('sintomas')} className="w-full flex items-center gap-3 p-4 text-left">
                  <span className="text-3xl">📝</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">Síntomas del Día</h3>
                    <p className="text-sm text-gray-500">{sintomasRegs.length} registro{sintomasRegs.length > 1 ? 's' : ''}</p>
                  </div>
                  <span className="text-xl text-gray-400">{expanded === 'sintomas' ? '▲' : '▼'}</span>
                </button>
                {expanded === 'sintomas' && (
                  <div className="px-4 pb-4 space-y-3">
                    {sintomasRegs.map((r, i) => {
                      const d = r.datos as Record<string, unknown>;
                      const hora = new Date(r.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                      return (
                        <div key={r.id ?? i} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <p className="text-xs text-gray-400 mb-3">🕐 {hora}</p>
                          <div className="space-y-2">
                            {Object.entries(SINTOMA_LABELS).map(([key, { label, positiveIsGood }]) => {
                              if (d[key] === undefined) return null;
                              const val = !!d[key];
                              const isGood = positiveIsGood ? val : !val;
                              return (
                                <div key={key} className="flex items-center justify-between">
                                  <span className="text-sm text-gray-700">{label}</span>
                                  <span className={`text-sm font-bold ${isGood ? 'text-green-600' : 'text-red-600'}`}>
                                    {val ? (isGood ? '✅ Sí' : '⚠️ Sí') : (isGood ? '✅ No' : '⚠️ No')}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          {d.energia !== undefined && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">⚡ Nivel de Energía</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-20 bg-gray-200 rounded-full h-2.5">
                                    <div className={`h-full rounded-full ${(d.energia as number) <= 3 ? 'bg-red-500' : (d.energia as number) <= 6 ? 'bg-amber-500' : 'bg-green-500'}`}
                                      style={{ width: `${((d.energia as number) / 10) * 100}%` }} />
                                  </div>
                                  <span className={`text-lg font-black ${(d.energia as number) <= 3 ? 'text-red-500' : (d.energia as number) <= 6 ? 'text-amber-500' : 'text-green-500'}`}>
                                    {d.energia as number}/10
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Sin datos ── */}
            {signosVitales.length === 0 && sintomasRegs.length === 0 && !(esHoy && tareasHechas > 0) && (
              <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 shadow-sm text-center">
                <span className="text-5xl">📭</span>
                <h3 className="text-xl font-bold text-gray-700 mt-3">Sin registros</h3>
                <p className="text-gray-500 mt-1">No hay datos guardados para este día.</p>
                {!esHoy && (
                  <Button variant="ghost" className="mt-4" onClick={() => setFecha(todayStr())}>
                    Ir a hoy
                  </Button>
                )}
              </div>
            )}
          </>
        )}

        <div className="h-4" />
      </div>
    </>
  );
}
