"use client";

import { useEffect, useState } from 'react';
import { getDailySummary, getSummariesForRange, DailySummary } from '@/lib/history';
import { fechaHoy } from '@/lib/db';

type View = 'day' | 'week' | 'month';

function formatDateLabel(d: string) {
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' });
}

function MiniLineChart({ data }: { data: DailySummary[] }) {
  const w = 600;
  const h = 120;
  if (data.length === 0) return <div>No data</div>;
  const max = 100;
  const stepX = w / Math.max(1, data.length - 1);
  const points = data.map((d, i) => `${i * stepX},${h - (d.percentage / max) * h}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32">
      <polyline fill="none" stroke="#10b981" strokeWidth={3} points={points} strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <circle key={d.date} cx={i * stepX} cy={h - (d.percentage / max) * h} r={3} fill="#065f46" />
      ))}
    </svg>
  );
}

export default function HistorialPage() {
  const [view, setView] = useState<View>('day');
  const [date, setDate] = useState<string>(fechaHoy());
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [rangeSummaries, setRangeSummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, date]);

  async function load() {
    setLoading(true);
    if (view === 'day') {
      const s = await getDailySummary(date);
      setSummary(s);
      setRangeSummaries([]);
    } else if (view === 'week') {
      // semana: 6 días atrás + hoy
      const end = date;
      const start = (() => {
        const d = new Date(date + 'T00:00:00');
        d.setDate(d.getDate() - 6);
        return d.toISOString().split('T')[0];
      })();
      const arr = await getSummariesForRange(start, end);
      setRangeSummaries(arr);
      setSummary(null);
    } else if (view === 'month') {
      const d = new Date(date + 'T00:00:00');
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const start = `${yyyy}-${mm}-01`;
      const end = new Date(yyyy, d.getMonth() + 1, 0).toISOString().split('T')[0];
      const arr = await getSummariesForRange(start, end);
      setRangeSummaries(arr);
      setSummary(null);
    }
    setLoading(false);
  }

  return (
    <main className="p-4 pb-24">
      <div className="flex items-center justify-between mb-4 historial-header">
        <h1 className="text-xl font-semibold">Resumen / Historial</h1>
        <div className="flex gap-2 items-center">
          <select value={view} onChange={(e) => setView(e.target.value as View)} className="input">
            <option value="day">Día</option>
            <option value="week">Semana</option>
            <option value="month">Mes</option>
          </select>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        </div>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : view === 'day' && summary ? (
          <section className="historial-grid-2">
            <div>
              <div className="mb-4 historial-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">{new Date(summary.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                    <h2 className="text-2xl font-bold">Resumen del día</h2>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Completado</div>
                    <div className="text-2xl font-semibold">{summary.percentage}%</div>
                  </div>
                </div>

                <div className="mt-3 bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div className="bg-green-500 h-full" style={{ width: `${summary.percentage}%` }} />
                </div>
              </div>

              <div className="mb-4 grid grid-cols-3 gap-2">
                {['respiratorio','ejercicio','cardiorrenal','energia','medicacion','mental'].map((t) => (
                  <div key={t} className={`historial-chip ${summary.typesCompleted.includes(t) ? 'historial-chip--done' : 'historial-chip--todo'}`}>
                    <div>{summary.typesCompleted.includes(t) ? '✅' : '⬜'}</div>
                    <div className="ml-1">{t}</div>
                  </div>
                ))}
              </div>

              <div className="historial-card">
                <h3 className="font-semibold mb-2">Registros</h3>
                {summary.registros.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay registros detallados para este día.</p>
                ) : (
                  <ul className="space-y-2">
                    {summary.registros.map((r: any) => (
                      <li key={r.id} className="historial-record">
                        <div className="text-sm text-gray-500">{r.tipo} · {new Date(r.timestamp).toLocaleTimeString()}</div>
                        <pre className="text-xs mt-2 overflow-auto">{JSON.stringify(r.datos ?? {}, null, 2)}</pre>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <aside>
              <div className="historial-card">
                <h3 className="font-semibold">Progreso</h3>
                <div className="mt-3 historial-chart">
                  <div className="text-sm text-gray-500">Completado</div>
                  <div className="text-3xl font-semibold">{summary.percentage}%</div>
                  <div className="mt-3 bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div className="bg-green-500 h-full" style={{ width: `${summary.percentage}%` }} />
                  </div>
                  <div className="mt-3 text-sm text-gray-600">Medicinas: {summary.medTaken} / {summary.medExpected} ({summary.medPercentage}%)</div>
                </div>
              </div>
            </aside>
          </section>
      ) : (
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold">Comparación ({view})</h2>
            <div className="text-sm text-gray-500">{rangeSummaries.length} días</div>
          </div>

          <div className="mb-4">
            <MiniLineChart data={rangeSummaries} />
            <div className="flex gap-2 mt-2 overflow-x-auto">
              {rangeSummaries.map((s) => (
                <div key={s.date} className="text-center text-xs w-20">
                  <div className="font-semibold">{s.percentage}%</div>
                  <div className="text-gray-500">{formatDateLabel(s.date)}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Detalle por día</h3>
            <div className="grid grid-cols-2 gap-2">
              {rangeSummaries.map((s) => (
                <div key={s.date} className="p-3 border rounded">
                  <div className="text-sm text-gray-500">{new Date(s.date+'T00:00:00').toLocaleDateString()}</div>
                  <div className="font-medium">{s.percentage}% — {s.typesCompleted.length} / 6</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
