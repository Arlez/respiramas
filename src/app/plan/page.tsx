'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Card from '@/components/ui/Card';
import {
  Ejercicio,
  EJERCICIOS,
  RUTINA_SEMANAL,
  RECOMENDACIONES,
  getDiaRutinaIdx,
  getBloquesHoy,
  ModalGuiado,
  ModalDetalle,
  ModalInstrucciones,
} from '../ejercicios/_shared';
import { reprogramarAlarmasDelDia, cancelarAlarma, stringToNumberId } from '@/services/alarmService';

export default function PlanPage() {
  const [ejercicioDetalle, setEjercicioDetalle] = useState<Ejercicio | null>(null);
  const [ejercicioGuiado, setEjercicioGuiado] = useState<Ejercicio | null>(null);
  const [ejercicioInstrucciones, setEjercicioInstrucciones] = useState<Ejercicio | null>(null);
  const [completados, setCompletados] = useState<Set<string>>(new Set());
  const [modoFatiga, setModoFatiga] = useState(false);
  const [showRecomendaciones, setShowRecomendaciones] = useState(false);
  const [pendingBloqueId, setPendingBloqueId] = useState<string | null>(null);

  useEffect(() => {
    const key = `ejercicios-completados-${new Date().toISOString().slice(0, 10)}`;
    try {
      const stored = JSON.parse(localStorage.getItem(key) || '[]');
      setCompletados(new Set(stored));
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    const bloquesActuales = getBloquesHoy(getDiaRutinaIdx(), modoFatiga);
    reprogramarAlarmasDelDia(bloquesActuales, completados);
  }, [completados, modoFatiga]);

  function marcarCompletado(id: string) {
    const key = `ejercicios-completados-${new Date().toISOString().slice(0, 10)}`;
    const nuevo = new Set(completados);
    nuevo.add(id);
    setCompletados(nuevo);
    try { localStorage.setItem(key, JSON.stringify([...nuevo])); } catch { /* noop */ }
    cancelarAlarma(stringToNumberId(id));
  }

  function handleIniciar(ejercicio: Ejercicio, bloqueId?: string) {
    setPendingBloqueId(bloqueId ?? null);
    if (ejercicio.pasos) {
      setEjercicioGuiado(ejercicio);
    } else {
      setEjercicioInstrucciones(ejercicio);
    }
    setEjercicioDetalle(null);
  }

  const ejercicioPorId = (id: string) => EJERCICIOS.find((e) => e.id === id);

  const diaIdx = getDiaRutinaIdx();
  const bloquesHoy = getBloquesHoy(diaIdx, modoFatiga);
  const bloquesConEjercicio = bloquesHoy.filter((b) => b.ejercicioId);
  const totalPlanHoy = bloquesConEjercicio.length;
  const completadosHoy = bloquesConEjercicio.filter((b) => completados.has(b.bloqueId)).length;
  const rutinaDiaHoy = RUTINA_SEMANAL[diaIdx];

  return (
    <>
      <Header titulo="📅 Plan" />

      <main className="max-w-3xl mx-auto px-4 pb-32 pt-4 space-y-4">

        {/* ── Progreso del día ── */}
        <Card color="green">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-green-800 font-bold text-lg">Progreso de hoy</p>
              <p className="text-green-600 text-sm">{completadosHoy} de {totalPlanHoy} ejercicios completados</p>
            </div>
            <span className="text-4xl">{completadosHoy === totalPlanHoy && totalPlanHoy > 0 ? '🏆' : '💪'}</span>
          </div>
          <div className="w-full bg-green-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-green-600 h-full rounded-full transition-all duration-500"
              style={{ width: totalPlanHoy > 0 ? `${(completadosHoy / totalPlanHoy) * 100}%` : '0%' }}
            />
          </div>
        </Card>

        {/* ── Regla de Oro — Toggle de fatiga ── */}
        <div className={`rounded-2xl p-4 border-2 transition-colors ${modoFatiga ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div className="flex-1">
              <p className="font-bold text-gray-800">Regla de Oro</p>
              <p className="text-sm text-gray-500">¿Más fatigada de lo habitual? Solo haz la parte respiratoria.</p>
            </div>
            <button
              onClick={() => setModoFatiga(!modoFatiga)}
              className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 ${modoFatiga ? 'bg-amber-500' : 'bg-gray-300'}`}
              aria-label="Activar modo fatiga"
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${modoFatiga ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>

        {/* ── Calendario semanal ── */}
        <div className="bg-white rounded-2xl p-4 border-2 border-gray-200 shadow-sm">
          <h3 className="text-base font-bold text-gray-700 mb-3">📅 Semana</h3>
          <div className="flex gap-1.5">
            {RUTINA_SEMANAL.map((dia, idx) => {
              const esHoy = idx === diaIdx;
              return (
                <div
                  key={idx}
                  className={`flex-1 py-2 px-1 rounded-xl text-center transition-colors ${esHoy ? 'bg-green-600 text-white ring-2 ring-green-400' : 'bg-gray-50 text-gray-600'}`}
                >
                  <p className={`text-xs font-bold ${esHoy ? 'text-white' : ''}`}>{dia.nombreCorto}</p>
                  <p className={`text-[10px] mt-0.5 leading-tight ${esHoy ? 'text-green-100' : 'text-gray-400'}`}>{dia.intensidad}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-3 bg-green-50 rounded-xl p-3 border border-green-200">
            <p className="text-xs text-green-600 font-semibold">HOY — {rutinaDiaHoy.nombre}</p>
            <p className="text-base text-green-800 font-bold mt-0.5">{rutinaDiaHoy.actividad}</p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-sm font-semibold ${rutinaDiaHoy.colorIntensidad}`}>
              Intensidad: {rutinaDiaHoy.intensidad}
            </span>
          </div>
        </div>

        {/* ── Cronograma del día ── */}
        <div className="bg-white rounded-2xl p-4 border-2 border-gray-200 shadow-sm">
          <h3 className="text-base font-bold text-gray-700 mb-3">🕐 Cronograma de Hoy</h3>
          <div className="space-y-2">
            {bloquesHoy.map((bloque, idx) => {
              const ejObj = bloque.ejercicioId ? ejercicioPorId(bloque.ejercicioId) : null;
              const hecho = completados.has(bloque.bloqueId);
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3 rounded-xl p-3 border-2 transition-colors ${
                    hecho
                      ? 'border-green-300 bg-green-50'
                      : bloque.tipo === 'comida'
                        ? 'border-orange-200 bg-orange-50'
                        : bloque.tipo === 'info'
                          ? 'border-gray-200 bg-gray-50'
                          : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="text-center flex-shrink-0 w-12">
                    <p className="text-xs font-bold text-gray-500">{bloque.hora}</p>
                    <span className="text-2xl">{bloque.icono}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-base ${hecho ? 'text-green-700 line-through' : 'text-gray-800'}`}>{bloque.nombre}</p>
                    <p className="text-sm text-gray-500 mt-1">{bloque.objetivo}</p>
                    {bloque.duracion && <p className="text-xs text-gray-400 mt-2">⏱️ {bloque.duracion}</p>}

                    <div className="mt-3">
                      {hecho ? (
                        <span className="text-green-600 text-xl">✅</span>
                      ) : ejObj ? (
                        <button
                          onClick={() => handleIniciar(ejObj, bloque.bloqueId)}
                          className="w-full sm:w-auto py-2 px-4 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors"
                        >
                          ▶ Guiar
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Recomendaciones (colapsable) ── */}
        <div className="bg-white rounded-2xl p-4 border-2 border-gray-200 shadow-sm">
          <button onClick={() => setShowRecomendaciones(!showRecomendaciones)} className="flex items-center justify-between w-full">
            <h3 className="text-base font-bold text-gray-700">💡 Recomendaciones</h3>
            <span className="text-gray-400">{showRecomendaciones ? '▲' : '▼'}</span>
          </button>
          {showRecomendaciones && (
            <div className="mt-3 space-y-3">
              {RECOMENDACIONES.map((r, i) => (
                <div key={i} className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                  <p className="text-base font-bold text-blue-800">{r.icono} {r.titulo}</p>
                  <p className="text-sm text-blue-700 mt-1">{r.texto}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {ejercicioDetalle && (
        <ModalDetalle
          ejercicio={ejercicioDetalle}
          onCerrar={() => setEjercicioDetalle(null)}
          onIniciar={() => handleIniciar(ejercicioDetalle)}
        />
      )}

      {ejercicioGuiado && (
        <ModalGuiado
          ejercicio={ejercicioGuiado}
          onCerrar={() => setEjercicioGuiado(null)}
          onCompletado={() => marcarCompletado(pendingBloqueId ?? ejercicioGuiado.id)}
        />
      )}

      {ejercicioInstrucciones && (
        <ModalInstrucciones
          ejercicio={ejercicioInstrucciones}
          onCerrar={() => setEjercicioInstrucciones(null)}
        />
      )}
    </>
  );
}
