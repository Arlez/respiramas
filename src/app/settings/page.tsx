'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { obtenerRecordatoriosConfig, guardarRecordatorioConfig, eliminarRecordatorioConfig } from '@/lib/db';
import { iniciarRecordatoriosFijos, cancelarRecordatorio, registrarServiceWorker, solicitarPermisoNotificaciones, enviarNotificacionLocal } from '@/lib/notifications';

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
  const [notifStatus, setNotifStatus] = useState<string>(() => (typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'));
  const [notifBusy, setNotifBusy] = useState(false);

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
  const inputCls = 'w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-green-400';

  /* ── Notificaciones push (manual) ── */
  const activarNotificaciones = async () => {
    if (typeof window === 'undefined') return;
    setNotifBusy(true);
    try {
      await registrarServiceWorker();
      const granted = await solicitarPermisoNotificaciones();
      setNotifStatus(granted ? 'granted' : Notification.permission ?? 'default');
      if (granted) {
        // Iniciar recordatorios para que las notificaciones programadas funcionen
        await iniciarRecordatoriosFijos();
        // enviar notificación de prueba
        try { await enviarNotificacionLocal('Notificaciones activadas', 'Has activado las notificaciones desde Ajustes'); } catch (e) { /* noop */ }
      }
    } finally {
      setNotifBusy(false);
    }
  };

  return (
    <>
      <Header titulo="⚙️ Ajustes" mostrarVolver />

      <div className="p-4 space-y-4">

        {/* ── Apariencia ── */}
        <Card icon="🎨" title="Apariencia" color="white">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800 text-lg leading-tight">
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
        </Card>

        {/* ── Notificaciones push ── */}
        <Card icon="🔔" title="Notificaciones push" color="white">
          <p className="text-gray-600 mb-3">
            Estado del permiso: <span className="font-semibold text-gray-800">{notifStatus}</span>
          </p>
          <div className="flex gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={activarNotificaciones}
              disabled={notifBusy}
              className="flex-1"
            >
              {notifBusy ? 'Procesando...' : 'Activar notificaciones'}
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={async () => {
                if (typeof window !== 'undefined' && 'Notification' in window)
                  setNotifStatus(Notification.permission);
              }}
            >
              Actualizar
            </Button>
          </div>
        </Card>

        {/* ── Recordatorios ── */}
        <Card icon="⏰" title="Recordatorios" color="white">
          <p className="text-gray-600 mb-4">
            Los recordatorios funcionan cuando la app tiene permiso de notificaciones.
          </p>

          {loading ? (
            <p className="text-gray-500 text-sm text-center py-4">Cargando...</p>
          ) : items.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No hay recordatorios configurados</p>
          ) : (
            <div className="space-y-3 mb-4">
              {items.map((it) => (
                <div
                  key={it.id}
                  className={`rounded-xl border-2 p-3 flex items-start gap-3 ${
                    it.activo
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{it.titulo}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{it.cuerpo}</p>
                    <p className="text-sm text-gray-400 mt-1">🕐 {it.horario}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => toggle(it)}
                      className={`text-sm font-bold px-3 py-1.5 rounded-full transition-colors min-h-[36px] ${
                        it.activo
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {it.activo ? 'Activo' : 'Inactivo'}
                    </button>
                    <button
                      onClick={() => remove(it.id)}
                      className="text-sm text-red-500 hover:text-red-700 px-2 min-h-[36px]"
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
              className="w-full border-2 border-dashed border-gray-300 rounded-xl py-3 text-base font-semibold text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors min-h-[48px]"
            >
              + Agregar recordatorio
            </button>
          ) : (
            <div className="space-y-3 bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
              <p className="font-bold text-gray-700">Nuevo recordatorio</p>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Título</label>
                <input className={inputCls} value={newTitulo} onChange={(e) => setNewTitulo(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Mensaje</label>
                <input className={inputCls} value={newCuerpo} onChange={(e) => setNewCuerpo(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Horario</label>
                <input type="time" className={`${inputCls} w-36`} value={newHorario} onChange={(e) => setNewHorario(e.target.value)} />
              </div>
              <div className="flex gap-3 pt-1">
                <Button variant="primary" size="md" onClick={add} className="flex-1">
                  Guardar
                </Button>
                <Button variant="ghost" size="md" onClick={() => setAddOpen(false)} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* ── Info de app ── */}
        <Card color="white" className="text-center">
          <p className="text-4xl mb-2">🫁</p>
          <p className="font-bold text-gray-700 text-lg">Respira Más</p>
          <p className="text-sm text-gray-400 mt-1">v0.1 · Para uso personal</p>
        </Card>

      </div>
    </>
  );
}

