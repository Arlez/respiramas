'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { obtenerRecordatoriosConfig, guardarRecordatorioConfig, eliminarRecordatorioConfig } from '@/lib/db';
import { iniciarRecordatoriosFijos, cancelarRecordatorio } from '@/lib/notifications';

type RecConfig = {
  id: string;
  titulo: string;
  cuerpo: string;
  horario: string;
  activo: boolean;
};

export default function SettingsPage() {
  const [items, setItems]       = useState<RecConfig[]>([]);
  const [loading, setLoading]   = useState(true);
  const [newHorario, setNewHorario] = useState('17:00');
  const [newTitulo, setNewTitulo]   = useState('🚶 Caminata suave');
  const [newCuerpo, setNewCuerpo]   = useState('Hora de tu caminata por intervalos');
  const [darkMode, setDarkMode]     = useState(false);
  const [addOpen, setAddOpen]       = useState(false);

  /* ── Cargar recordatorios ── */
  const load = async () => {
    setLoading(true);
    try {
      const cfg = await obtenerRecordatoriosConfig();
      setItems(cfg as RecConfig[]);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  /* ── Leer tema actual del DOM ── */
  useEffect(() => {
    load();
    setDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  /* ── Toggle modo oscuro ── */
  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  /* ── Recordatorios ── */
  const toggle = async (it: RecConfig) => {
    const updated = { ...it, activo: !it.activo };
    await guardarRecordatorioConfig(updated as any);
    if (!updated.activo) cancelarRecordatorio(updated.id);
    await iniciarRecordatoriosFijos();
    load();
  };

  const remove = async (id: string) => {
    await eliminarRecordatorioConfig(id);
    cancelarRecordatorio(id);
    await iniciarRecordatoriosFijos();
    load();
  };

  const add = async () => {
    if (!newTitulo.trim()) return;
    const id = 'rec-' + Date.now();
    await guardarRecordatorioConfig({ id, titulo: newTitulo, cuerpo: newCuerpo, horario: newHorario, activo: true } as any);
    await iniciarRecordatoriosFijos();
    setNewTitulo('🚶 Caminata suave');
    setNewCuerpo('Hora de tu caminata por intervalos');
    setNewHorario('17:00');
    setAddOpen(false);
    load();
  };

  /* ── helpers visuales ── */
  const cardBase = 'rounded-2xl border p-4 bg-white border-gray-200 shadow-sm';
  const labelCls = 'block text-sm font-semibold text-gray-600 mb-1';
  const inputCls = 'w-full rounded-xl border border-gray-300 px-3 py-2.5 text-base bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400';

  return (
    <>
      <Header titulo="⚙️ Ajustes" mostrarVolver />

      <div className="px-4 pb-10 space-y-5 mt-3">

        {/* ── Apariencia ── */}
        <div className={cardBase}>
          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            🎨 Apariencia
          </h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800 text-base leading-tight">
                {darkMode ? '🌙 Modo Oscuro' : '☀️ Modo Claro'}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                {darkMode ? 'Fondo oscuro, menos cansancio ocular' : 'Fondo claro, aspecto estándar'}
              </p>
            </div>
            <button
              className={`theme-toggle ${darkMode ? 'active' : ''}`}
              onClick={toggleDark}
              aria-label="Cambiar modo oscuro"
              aria-pressed={darkMode}
            >
              <span className="theme-toggle__dot" />
            </button>
          </div>
        </div>

        {/* ── Recordatorios ── */}
        <div className={cardBase}>
          <h2 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
            🔔 Recordatorios
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Los recordatorios funcionan cuando la app tiene permiso de notificaciones.
          </p>

          {loading ? (
            <p className="text-gray-500 text-sm text-center py-4">Cargando...</p>
          ) : items.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No hay recordatorios configurados</p>
          ) : (
            <div className="space-y-3">
              {items.map((it) => (
                <div
                  key={it.id}
                  className={`rounded-xl border p-3 flex items-start gap-3 ${
                    it.activo
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{it.titulo}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{it.cuerpo}</p>
                    <p className="text-xs text-gray-400 mt-1">🕐 {it.horario}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => toggle(it)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
                        it.activo
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {it.activo ? 'Activo' : 'Inactivo'}
                    </button>
                    <button
                      onClick={() => remove(it.id)}
                      className="text-xs text-red-500 hover:text-red-700 px-2"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Agregar nuevo */}
          {!addOpen ? (
            <button
              onClick={() => setAddOpen(true)}
              className="mt-4 w-full border-2 border-dashed border-gray-300 rounded-xl py-3 text-sm font-semibold text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors"
            >
              + Agregar recordatorio
            </button>
          ) : (
            <div className="mt-4 space-y-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-bold text-gray-700">Nuevo recordatorio</p>
              <div>
                <label className={labelCls}>Título</label>
                <input className={inputCls} value={newTitulo} onChange={(e) => setNewTitulo(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Mensaje</label>
                <input className={inputCls} value={newCuerpo} onChange={(e) => setNewCuerpo(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Horario</label>
                <input type="time" className={`${inputCls} w-36`} value={newHorario} onChange={(e) => setNewHorario(e.target.value)} />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={add}
                  className="flex-1 bg-green-600 text-white font-bold rounded-xl py-2.5 text-sm hover:bg-green-700 active:scale-95 transition-all"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setAddOpen(false)}
                  className="flex-1 bg-gray-200 text-gray-700 font-bold rounded-xl py-2.5 text-sm hover:bg-gray-300 active:scale-95 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Info de app ── */}
        <div className={`${cardBase} text-center`}>
          <p className="text-3xl mb-2">🫁</p>
          <p className="font-bold text-gray-700 text-base">Respira Más</p>
          <p className="text-xs text-gray-400 mt-1">v0.1 · Para uso personal</p>
        </div>

      </div>
    </>
  );
}

