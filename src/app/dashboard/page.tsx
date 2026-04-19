'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ResponsiveContainer,
  LineChart, Line,
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { pacientesApi, metricasApi, cumplimientoApi, getPacienteId } from '@/lib/api';
import type { EvolucionData, MetricaAPI } from '@/lib/api';

/* ── Tipos ────────────────────────────────────────────────────────────────── */
type Periodo = '7d' | '30d' | '12m';

interface StatCard {
  label: string;
  value: string | number;
  unit?: string;
  color: string;
  icon: string;
  sub?: string;
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function fechaHoy(): string {
  return new Date().toISOString().slice(0, 10);
}

function labelFecha(fecha: string, periodo: Periodo): string {
  const d = new Date(fecha + 'T00:00:00');
  if (periodo === '12m') return d.toLocaleDateString('es', { month: 'short' });
  return d.toLocaleDateString('es', { day: '2-digit', month: 'short' });
}

function promedio(arr: { valor: number }[]): number | null {
  if (!arr.length) return null;
  return Math.round(arr.reduce((s, x) => s + x.valor, 0) / arr.length);
}

function ultimoValor(arr: { valor: number }[]): number | null {
  if (!arr.length) return null;
  return arr[arr.length - 1].valor;
}

const PERIODOS: { key: Periodo; label: string; dias: number }[] = [
  { key: '7d',  label: '7 días',  dias: 7   },
  { key: '30d', label: '30 días', dias: 30  },
  { key: '12m', label: '12 meses', dias: 365 },
];

/* ── Tooltip personalizado ────────────────────────────────────────────────── */
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-3 py-2 text-sm">
      <p className="font-semibold text-gray-600 dark:text-gray-300 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-bold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

/* ── Componente StatCard ─────────────────────────────────────────────────── */
function StatCardUI({ card }: { card: StatCard }) {
  return (
    <div className={`rounded-2xl p-5 border ${card.color}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</p>
          <p className="text-3xl font-black mt-1 text-gray-800 dark:text-gray-100">
            {card.value}
            {card.unit && <span className="text-lg font-semibold ml-1 text-gray-500">{card.unit}</span>}
          </p>
          {card.sub && <p className="text-xs text-gray-400 mt-1">{card.sub}</p>}
        </div>
        <span className="text-3xl">{card.icon}</span>
      </div>
    </div>
  );
}

/* ── Sección chart wrapper ─────────────────────────────────────────────────── */
function ChartCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
      <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h3>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
   ══════════════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const [periodo, setPeriodo] = useState<Periodo>('30d');
  const [evolucion, setEvolucion] = useState<EvolucionData | null>(null);
  const [hoyMetrica, setHoyMetrica] = useState<MetricaAPI | null>(null);
  const [cumplHoy, setCumplHoy] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [nombrePaciente, setNombrePaciente] = useState('Paciente');

  const cargarDatos = useCallback(async (p: Periodo) => {
    setLoading(true);
    try {
      const paciente = await pacientesApi.getPrincipal();
      setNombrePaciente(paciente.nombre ?? 'Paciente');
      const pid = paciente.id;
      const dias = PERIODOS.find(x => x.key === p)!.dias;
      const [evo, hoy, cumpl] = await Promise.all([
        metricasApi.getEvolucion(pid, dias),
        metricasApi.getByFecha(pid, fechaHoy()),
        cumplimientoApi.getPorcentaje(pid, fechaHoy()).catch(() => ({ porcentaje: null })),
      ]);
      setEvolucion(evo);
      setHoyMetrica(hoy);
      setCumplHoy((cumpl as { porcentaje: number | null }).porcentaje);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos(periodo);
  }, [periodo, cargarDatos]);

  /* ── Preparar datos para charts ─────────────────────────────────────────── */
  const dataSpo2 = (evolucion?.spo2 ?? []).map(d => ({
    fecha: labelFecha(d.fecha, periodo),
    SpO2: d.valor,
  }));

  const dataPulso = (evolucion?.pulso ?? []).map(d => ({
    fecha: labelFecha(d.fecha, periodo),
    Pulso: d.valor,
  }));

  const dataSpo2Pulso = dataSpo2.map((d, i) => ({
    fecha: d.fecha,
    SpO2: d.SpO2,
    Pulso: dataPulso[i]?.Pulso ?? null,
  }));

  const dataPresion = (evolucion?.presion ?? []).map(d => ({
    fecha: labelFecha(d.fecha, periodo),
    Sistólica: d.sistolica,
    Diastólica: d.diastolica,
  }));

  const dataPeso = (evolucion?.peso ?? []).map(d => ({
    fecha: labelFecha(d.fecha, periodo),
    Peso: d.valor,
  }));

  const dataEnergia = (evolucion?.energia ?? []).map(d => ({
    fecha: labelFecha(d.fecha, periodo),
    Energía: d.valor,
  }));

  const dataCumpl = (evolucion?.cumplimientoMedicacion ?? []).map(d => ({
    fecha: labelFecha(d.fecha, periodo),
    '%': Math.round(d.valor),
  }));

  const dataCumplProtocolo = (evolucion?.cumplimientoProtocolo ?? []).map(d => ({
    fecha: labelFecha(d.fecha, periodo),
    '%': Math.round(d.valor),
  }));

  /* ── Summary cards ─────────────────────────────────────────────────────── */
  const spo2Prom = promedio(evolucion?.spo2 ?? []);
  const pulsoProm = promedio(evolucion?.pulso ?? []);
  const pesoActual = ultimoValor(evolucion?.peso ?? []);
  const cumplProm = promedio((evolucion?.cumplimientoMedicacion ?? []).map(d => ({ valor: d.valor })));

  const cards: StatCard[] = [
    {
      label: 'SpO₂ promedio',
      value: spo2Prom ?? (hoyMetrica?.spo2 ?? '—'),
      unit: '%',
      icon: '🫁',
      color: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
      sub: spo2Prom ? `Último: ${ultimoValor(evolucion?.spo2 ?? []) ?? '—'}%` : 'Sin datos',
    },
    {
      label: 'Pulso promedio',
      value: pulsoProm ?? (hoyMetrica?.pulso ?? '—'),
      unit: 'bpm',
      icon: '❤️',
      color: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
      sub: pulsoProm ? `Último: ${ultimoValor(evolucion?.pulso ?? []) ?? '—'} bpm` : 'Sin datos',
    },
    {
      label: 'Peso actual',
      value: pesoActual ?? (hoyMetrica?.peso ?? '—'),
      unit: 'kg',
      icon: '⚖️',
      color: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
      sub: dataPeso.length >= 2
        ? `vs inicio: ${(+(dataPeso[dataPeso.length - 1]?.Peso ?? 0) - +(dataPeso[0]?.Peso ?? 0)).toFixed(1)} kg`
        : 'Sin datos',
    },
    {
      label: 'Cumplimiento medicación',
      value: cumplProm ?? (cumplHoy ?? '—'),
      unit: '%',
      icon: '💊',
      color: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800',
      sub: cumplProm !== null ? `Hoy: ${cumplHoy ?? '—'}%` : 'Sin datos',
    },
  ];

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ── Header ── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-800 dark:text-gray-100">📊 Dashboard Clínico</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{nombrePaciente} · Evolución y tendencias</p>
          </div>
          {/* Selector de período */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1">
            {PERIODOS.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriodo(p.key)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  periodo === p.key
                    ? 'bg-white dark:bg-gray-700 text-green-700 dark:text-green-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">Cargando datos...</p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Métricas de hoy (fila siempre visible) ── */}
            {hoyMetrica && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4">
                <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider mb-3">Hoy · {new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { label: 'SpO₂', val: hoyMetrica.spo2, unit: '%', color: 'text-blue-700' },
                    { label: 'Pulso', val: hoyMetrica.pulso, unit: 'bpm', color: 'text-red-700' },
                    { label: 'Presión', val: hoyMetrica.presionSistolica ? `${hoyMetrica.presionSistolica}/${hoyMetrica.presionDiastolica}` : null, unit: '', color: 'text-orange-700' },
                    { label: 'Peso', val: hoyMetrica.peso, unit: 'kg', color: 'text-green-700' },
                    { label: 'Energía', val: hoyMetrica.energia, unit: '/10', color: 'text-yellow-700' },
                    { label: 'Agua', val: hoyMetrica.vasosAgua, unit: ' vasos', color: 'text-cyan-700' },
                  ].map(m => (
                    <div key={m.label} className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{m.label}</p>
                      <p className={`text-xl font-black ${m.color} dark:opacity-90`}>
                        {m.val ?? <span className="text-gray-300 text-base">—</span>}
                        {m.val != null && <span className="text-xs font-normal ml-0.5 text-gray-400">{m.unit}</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Summary cards ── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {cards.map(c => <StatCardUI key={c.label} card={c} />)}
            </div>

            {/* ── Charts ── */}
            {(dataSpo2Pulso.length > 0 || dataPresion.length > 0 || dataPeso.length > 0) ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                {/* SpO2 + Pulso */}
                {dataSpo2Pulso.length > 0 && (
                  <ChartCard title="SpO₂ y Pulso" icon="🫁">
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={dataSpo2Pulso} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="spo2" domain={[80, 100]} tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="pulso" orientation="right" domain={[40, 130]} tick={{ fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line yAxisId="spo2" type="monotone" dataKey="SpO2" stroke="#3b82f6" strokeWidth={2} dot={false} connectNulls />
                        <Line yAxisId="pulso" type="monotone" dataKey="Pulso" stroke="#ef4444" strokeWidth={2} dot={false} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )}

                {/* Presión arterial */}
                {dataPresion.length > 0 && (
                  <ChartCard title="Presión Arterial" icon="🩺">
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={dataPresion} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                        <YAxis domain={[50, 180]} tick={{ fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line type="monotone" dataKey="Sistólica" stroke="#f97316" strokeWidth={2} dot={false} connectNulls />
                        <Line type="monotone" dataKey="Diastólica" stroke="#fb923c" strokeWidth={2} strokeDasharray="4 4" dot={false} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )}

                {/* Peso */}
                {dataPeso.length > 0 && (
                  <ChartCard title="Evolución del Peso" icon="⚖️">
                    <ResponsiveContainer width="100%" height={240}>
                      <AreaChart data={dataPeso} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <defs>
                          <linearGradient id="pesoGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                        <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="Peso" stroke="#22c55e" fill="url(#pesoGrad)" strokeWidth={2} dot={false} connectNulls />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )}

                {/* Energía */}
                {dataEnergia.length > 0 && (
                  <ChartCard title="Nivel de Energía" icon="⚡">
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={dataEnergia} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="Energía" fill="#eab308" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )}

                {/* Cumplimiento medicación */}
                {dataCumpl.length > 0 && (
                  <ChartCard title="Cumplimiento Medicación" icon="💊">
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={dataCumpl} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="%" fill="#a855f7" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )}

                {/* Cumplimiento protocolo */}
                {dataCumplProtocolo.length > 0 && (
                  <ChartCard title="Cumplimiento Protocolo" icon="📋">
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={dataCumplProtocolo} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="%" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )}
              </div>
            ) : (
              /* Sin datos */
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <p className="text-5xl mb-4">📊</p>
                <p className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">Sin datos para este período</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Registra métricas diarias en la sección Protocolo para ver la evolución aquí.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
