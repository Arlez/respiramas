'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Card from '@/components/ui/Card';
import { getDailySummary, getSummariesForRange, DailySummary } from '@/lib/history';
import { fechaHoy } from '@/lib/db';

type View = 'day' | 'week' | 'month';

const TIPO_ICONOS: Record<string, string> = {
  respiratorio: '🫁',
  ejercicio: '🚶',
  cardiorrenal: '❤️',
  energia: '⚡',
  medicacion: '💊',
  mental: '🧘',
};

const TIPO_NOMBRES: Record<string, string> = {
  respiratorio: 'Respiratorio',
  ejercicio: 'Ejercicio',
  cardiorrenal: 'Corazón y Riñón',
  energia: 'Energía',
  medicacion: 'Medicación',
  mental: 'Mente',
};

const TIPOS = ['respiratorio', 'ejercicio', 'cardiorrenal', 'energia', 'medicacion', 'mental'];

const VIEW_LABELS: Record<View, string> = { day: 'Día', week: 'Semana', month: 'Mes' };

function formatDateLabel(d: string) {
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' });
}

function MiniLineChart({ data }: { data: DailySummary[] }) {
  const w = 600;
  const h = 120;
  if (data.length === 0) return null;
  const stepX = w / Math.max(1, data.length - 1);
  const points = data.map((d, i) => `${i * stepX},${h - (d.percentage / 100) * h}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-28">
      <polyline fill="none" stroke="#16a34a" strokeWidth={3} points={points} strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <circle key={d.date} cx={i * stepX} cy={h - (d.percentage / 100) * h} r={5} fill="#15803d" />
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
    <>
      <Header titulo="📜 Historial" />
      <div className="p-4 space-y-4">

        {/* Controles de vista y fecha */}
        <Card color="white">
          <div className="flex gap-3 flex-wrap items-center">
            <div className="flex rounded-xl overflow-hidden border-2 border-gray-200 flex-shrink-0">
              {(['day', 'week', 'month'] as View[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-4 py-2 text-sm font-semibold transition-colors min-h-[44px] ${
                    view === v
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {VIEW_LABELS[v]}
                </button>
              ))}
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 min-w-[140px] rounded-xl border-2 border-gray-200 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
        </Card>

        {loading ? (
          <Card color="white">
            <p className="text-gray-500 text-center py-4">Cargando...</p>
          </Card>
        ) : view === 'day' && summary ? (
          <>
            {/* Resumen del día */}
            <Card icon="📊" title="Resumen del día" color="green">
              <p className="text-sm text-gray-500 mb-3">
                {new Date(summary.date + 'T00:00:00').toLocaleDateString('es-ES', {
                  weekday: 'long', day: 'numeric', month: 'long',
                })}
              </p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-lg">Actividades completadas</span>
                <span className="text-4xl font-bold text-green-700">{summary.percentage}%</span>
              </div>
              <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                <div className="bg-green-500 h-full transition-all" style={{ width: `${summary.percentage}%` }} />
              </div>
              {summary.medExpected > 0 && (
                <p className="text-sm text-gray-500 mt-3">
                  💊 Medicinas tomadas: {summary.medTaken} / {summary.medExpected} ({summary.medPercentage}%)
                </p>
              )}
            </Card>

            {/* Módulos del día */}
            <Card icon="✅" title="Módulos del día" color="white">
              <div className="flex flex-wrap gap-2">
                {TIPOS.map((t) => {
                  const done = summary.typesCompleted.includes(t);
                  return (
                    <div
                      key={t}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold border-2 ${
                        done
                          ? 'bg-green-50 text-green-800 border-green-200'
                          : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}
                    >
                      <span>{TIPO_ICONOS[t]}</span>
                      <span>{TIPO_NOMBRES[t]}</span>
                      <span>{done ? '✅' : '⬜'}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        ) : (
          <>
            {/* Gráfico de evolución */}
            <Card icon="📈" title={`Evolución — ${VIEW_LABELS[view]}`} color="white">
              <MiniLineChart data={rangeSummaries} />
              <div className="flex gap-3 mt-3 overflow-x-auto pb-1">
                {rangeSummaries.map((s) => (
                  <div key={s.date} className="text-center text-xs min-w-[56px] flex-shrink-0">
                    <div className="font-bold text-green-700">{s.percentage}%</div>
                    <div className="text-gray-500">{formatDateLabel(s.date)}</div>
                  </div>
                ))}
                {rangeSummaries.length === 0 && (
                  <p className="text-gray-400 py-2">No hay registros para este período</p>
                )}
              </div>
            </Card>

            {/* Detalle por día */}
            {rangeSummaries.length > 0 && (
              <Card icon="📅" title="Detalle por día" color="white">
                <div className="grid grid-cols-2 gap-2">
                  {rangeSummaries.map((s) => (
                    <div
                      key={s.date}
                      className="p-3 rounded-xl border-2 border-gray-200 bg-gray-50"
                    >
                      <div className="text-xs text-gray-500">
                        {new Date(s.date + 'T00:00:00').toLocaleDateString('es-ES', {
                          weekday: 'short', day: '2-digit', month: 'short',
                        })}
                      </div>
                      <div className="font-bold text-gray-800 text-lg mt-1">{s.percentage}%</div>
                      <div className="text-xs text-gray-500">{s.typesCompleted.length} / 6 módulos</div>
                      <div className="bg-gray-200 rounded-full h-2 mt-2 overflow-hidden">
                        <div className="bg-green-500 h-full" style={{ width: `${s.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </>
  );
}
