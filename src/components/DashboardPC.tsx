'use client';

import { useEffect, useState } from 'react';
import { pacientesApi, metricasApi, cumplimientoApi, getPacienteId, type PacienteInfo, type EvolucionData } from '@/lib/api';

function hoy() {
  return new Date().toISOString().split('T')[0];
}

export default function DashboardPC() {
  const [paciente, setPaciente] = useState<PacienteInfo | null>(null);
  const [evolucion, setEvolucion] = useState<EvolucionData | null>(null);
  const [cumplimiento, setCumplimiento] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const p = await pacientesApi.getPrincipal();
        setPaciente(p);

        const [evo, cum] = await Promise.all([
          metricasApi.getEvolucion(p.id, 7).catch(() => null),
          cumplimientoApi.getPorcentaje(p.id, hoy()).catch(() => null),
        ]);

        setEvolucion(evo);
        setCumplimiento(cum?.porcentaje ?? null);
      } catch { /* offline */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 p-6 text-center">
        <p className="text-red-600 dark:text-red-400 font-semibold">⚠️ Sin conexión al servidor</p>
        <p className="text-sm text-red-500 mt-1">Inicia el backend con <code className="bg-red-100 dark:bg-red-900 px-1 rounded">npm run start:local</code></p>
      </div>
    );
  }

  const lastSpo2 = evolucion?.spo2?.at(-1);
  const lastPulso = evolucion?.pulso?.at(-1);
  const lastPresion = evolucion?.presion?.at(-1);
  const lastPeso = evolucion?.peso?.at(-1);
  const lastEnergia = evolucion?.energia?.at(-1);

  // Mini sparkline de últimos valores
  const pesoTrend = evolucion?.peso ?? [];
  const spo2Trend = evolucion?.spo2 ?? [];

  return (
    <div className="space-y-4">
      {/* ── Header paciente ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-2xl">🫁</div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{paciente.nombre}</h2>
            <div className="flex gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
              {paciente.edad && <span>{paciente.edad} años</span>}
              {paciente.peso && <span>{paciente.peso} kg</span>}
              {paciente.imc && <span>IMC {Number(paciente.imc).toFixed(1)}</span>}
            </div>
          </div>
          {paciente.vasosRecomendados && (
            <div className="text-center">
              <p className="text-2xl">💧</p>
              <p className="text-xs text-gray-500">{paciente.vasosRecomendados} vasos</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Métricas hoy ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Métricas de hoy</h3>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="SpO₂" value={lastSpo2?.valor} unit="%" icon="🫁" color="blue" good={lastSpo2 ? lastSpo2.valor >= 92 : undefined} />
          <MetricCard label="Pulso" value={lastPulso?.valor} unit="bpm" icon="💓" color="red" good={lastPulso ? lastPulso.valor >= 50 && lastPulso.valor <= 100 : undefined} />
          <MetricCard label="Presión" value={lastPresion ? `${lastPresion.sistolica}/${lastPresion.diastolica}` : undefined} unit="mmHg" icon="🩺" color="purple" />
          <MetricCard label="Peso" value={lastPeso?.valor} unit="kg" icon="⚖️" color="green" />
          <MetricCard label="Energía" value={lastEnergia?.valor} unit="/10" icon="⚡" color="yellow" good={lastEnergia ? lastEnergia.valor <= 5 : undefined} />
          <MetricCard label="Medicación" value={cumplimiento != null ? Math.round(cumplimiento) : undefined} unit="%" icon="💊" color="indigo" good={cumplimiento != null ? cumplimiento >= 80 : undefined} />
        </div>
      </div>

      {/* ── Tendencias ── */}
      {pesoTrend.length > 1 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Tendencia de peso (7 días)</h3>
          <MiniChart data={pesoTrend.map(p => p.valor)} labels={pesoTrend.map(p => p.fecha.slice(5))} unit="kg" color="#16a34a" />
        </div>
      )}

      {spo2Trend.length > 1 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Tendencia SpO₂ (7 días)</h3>
          <MiniChart data={spo2Trend.map(p => p.valor)} labels={spo2Trend.map(p => p.fecha.slice(5))} unit="%" color="#2563eb" />
        </div>
      )}
    </div>
  );
}

// ── Tarjeta de métrica ─────────────────────────────────────────────────────────
function MetricCard({ label, value, unit, icon, color, good }: {
  label: string;
  value?: number | string;
  unit: string;
  icon: string;
  color: string;
  good?: boolean;
}) {
  const bgMap: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20',
    red: 'bg-red-50 dark:bg-red-900/20',
    purple: 'bg-purple-50 dark:bg-purple-900/20',
    green: 'bg-green-50 dark:bg-green-900/20',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20',
  };

  return (
    <div className={`rounded-xl p-3 ${bgMap[color] ?? bgMap.blue}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{icon} {label}</span>
        {good !== undefined && (
          <span className={`w-2 h-2 rounded-full ${good ? 'bg-green-500' : 'bg-red-500'}`} />
        )}
      </div>
      {value !== undefined ? (
        <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
          {value}<span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>
        </p>
      ) : (
        <p className="text-sm text-gray-400 italic">Sin datos</p>
      )}
    </div>
  );
}

// ── Mini gráfico simple con barras ─────────────────────────────────────────────
function MiniChart({ data, labels, unit, color }: {
  data: number[];
  labels: string[];
  unit: string;
  color: string;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  return (
    <div>
      <div className="flex items-end gap-1 h-20">
        {data.map((val, i) => {
          const height = Math.max(((val - min) / range) * 100, 8);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-gray-500 font-medium">{val}</span>
              <div
                className="w-full rounded-t-sm transition-all"
                style={{ height: `${height}%`, backgroundColor: color, opacity: 0.7 + (i / data.length) * 0.3 }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 mt-1">
        {labels.map((l, i) => (
          <span key={i} className="flex-1 text-[9px] text-gray-400 text-center">{l}</span>
        ))}
      </div>
    </div>
  );
}
