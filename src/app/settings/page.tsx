'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { obtenerRecordatoriosConfig, guardarRecordatorioConfig, eliminarRecordatorioConfig } from '@/lib/db';
import { iniciarRecordatoriosFijos, cancelarRecordatorio, registrarServiceWorker, solicitarPermisoNotificaciones, enviarNotificacionLocal } from '@/lib/notifications';
import { pacientesApi, recordatoriosApi, getPacienteId } from '@/lib/api';
import type { PacienteInfo } from '@/lib/api';

type RecConfig = { id: string; titulo: string; cuerpo: string; horario: string; activo: boolean };

export default function SettingsPage() {
  const [items, setItems] = useState<RecConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [newHorario, setNewHorario] = useState('17:00');
  const [newTitulo, setNewTitulo] = useState('Caminata suave');
  const [newCuerpo, setNewCuerpo] = useState('Hora de tu caminata por intervalos');
  const [darkMode, setDarkMode] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [notifStatus, setNotifStatus] = useState<string>(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [notifBusy, setNotifBusy] = useState(false);
  const [paciente, setPaciente] = useState<PacienteInfo | null>(null);
  const [pNombre, setPNombre] = useState('');
  const [pEdad, setPEdad] = useState(0);
  const [pPeso, setPPeso] = useState(0);
  const [pEstatura, setPEstatura] = useState(0);
  const [pacienteGuardado, setPacienteGuardado] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'loading' | 'connected' | 'offline'>('loading');

  const loadRecs = useCallback(async () => {
    setLoading(true);
    try {
      const pid = getPacienteId();
      if (pid) { try { const recs = await recordatoriosApi.getAll(pid); setItems(recs.map(r => ({ id: r.id!, titulo: r.titulo, cuerpo: r.cuerpo ?? '', horario: r.horario, activo: r.activo }))); setLoading(false); return; } catch {} }
      const cfg = await obtenerRecordatoriosConfig(); setItems(cfg as RecConfig[]);
    } catch { setItems([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    setDarkMode(document.documentElement.classList.contains('dark'));
    (async () => {
      try {
        const p = await pacientesApi.getPrincipal();
        setPaciente(p); setPNombre(p.nombre ?? ''); setPEdad(p.edad ?? 0); setPPeso(p.peso ?? 0); setPEstatura(p.estatura ?? 0);
        setBackendStatus('connected');
      } catch {
        setBackendStatus('offline');
        try { const d = JSON.parse(localStorage.getItem('paciente-datos') || '{}'); if (d.nombre) setPNombre(d.nombre); if (d.edad) setPEdad(Number(d.edad)); if (d.peso) setPPeso(Number(d.peso)); if (d.estatura) setPEstatura(Number(d.estatura)); } catch {}
      }
    })();
    loadRecs();
  }, [loadRecs]);

  async function guardarPaciente() {
    const payload: Record<string, unknown> = {};
    if (pNombre) payload.nombre = pNombre;
    if (pEdad > 0) payload.edad = pEdad;
    if (pPeso > 0) payload.peso = pPeso;
    if (pEstatura > 0) payload.estatura = pEstatura;
    localStorage.setItem('paciente-datos', JSON.stringify({ nombre: pNombre, edad: pEdad, peso: pPeso, estatura: pEstatura }));
    if (paciente?.id) { try { await pacientesApi.update(paciente.id, payload as Partial<PacienteInfo>); const w = await pacientesApi.calcularIMC(paciente.id); setPaciente(w); } catch {} }
    setPacienteGuardado(true); setTimeout(() => setPacienteGuardado(false), 2500);
  }

  const dIMC = paciente?.imc ?? (pPeso > 0 && pEstatura > 0 ? Number((pPeso / ((pEstatura / 100) ** 2)).toFixed(1)) : null);
  const dCat = paciente?.imcCategoria ?? (dIMC ? (dIMC < 18.5 ? 'Bajo peso' : dIMC < 25 ? 'Peso normal' : dIMC < 30 ? 'Sobrepeso' : 'Obesidad') : null);
  const dAgua = paciente?.aguaML ?? (pPeso > 0 ? Math.min(pPeso * 25, 1500) : null);
  const dVasos = paciente?.vasosRecomendados ?? (dAgua ? Math.round(dAgua / 200) : null);

  const toggleDark = () => { const n = !darkMode; setDarkMode(n); if (n) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); } else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); } };
  const toggleRec = async (it: RecConfig) => { const pid = getPacienteId(); if (pid) { try { await recordatoriosApi.toggle(it.id); loadRecs(); return; } catch {} } const u = { ...it, activo: !it.activo }; await guardarRecordatorioConfig(u as any); if (!u.activo) cancelarRecordatorio(u.id); await iniciarRecordatoriosFijos(); loadRecs(); };
  const removeRec = async (id: string) => { const pid = getPacienteId(); if (pid) { try { await recordatoriosApi.delete(id); loadRecs(); return; } catch {} } await eliminarRecordatorioConfig(id); cancelarRecordatorio(id); await iniciarRecordatoriosFijos(); loadRecs(); };
  const addRec = async () => { if (!newTitulo.trim()) return; const pid = getPacienteId(); if (pid) { try { await recordatoriosApi.create({ pacienteId: pid, titulo: newTitulo, cuerpo: newCuerpo, horario: newHorario }); setNewTitulo('Caminata suave'); setNewCuerpo('Hora de tu caminata por intervalos'); setNewHorario('17:00'); setAddOpen(false); loadRecs(); return; } catch {} } const id = 'rec-' + Date.now(); await guardarRecordatorioConfig({ id, titulo: newTitulo, cuerpo: newCuerpo, horario: newHorario, activo: true } as any); await iniciarRecordatoriosFijos(); setNewTitulo('Caminata suave'); setNewCuerpo('Hora de tu caminata por intervalos'); setNewHorario('17:00'); setAddOpen(false); loadRecs(); };
  const activarNotif = async () => { if (typeof window === 'undefined') return; setNotifBusy(true); try { await registrarServiceWorker(); const g = await solicitarPermisoNotificaciones(); setNotifStatus(g ? 'granted' : Notification.permission ?? 'default'); if (g) { await iniciarRecordatoriosFijos(); } } finally { setNotifBusy(false); } };

  const inp = 'w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-green-400';

  return (
    <>
      <Header titulo="Ajustes" mostrarVolver />
      <div className="p-4 space-y-4">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${backendStatus === 'connected' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : backendStatus === 'offline' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-500'}`}>
          <span className={`w-2.5 h-2.5 rounded-full ${backendStatus === 'connected' ? 'bg-green-500' : backendStatus === 'offline' ? 'bg-red-500' : 'bg-gray-400'}`} />
          {backendStatus === 'connected' ? 'Conectado al servidor' : backendStatus === 'offline' ? 'Sin conexion (modo local)' : 'Conectando...'}
        </div>

        <Card icon="" title="Datos del Paciente" color="white">
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Los datos se guardan en el servidor.</p>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">Nombre</label>
              <input className={inp} value={pNombre} onChange={(e) => setPNombre(e.target.value)} placeholder="Nombre" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">Edad</label>
                <input type="number" inputMode="numeric" className={`${inp} text-center px-1`} value={pEdad || ''} onChange={(e) => setPEdad(Number(e.target.value))} min={0} max={120} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">Peso (kg)</label>
                <input type="number" inputMode="decimal" className={`${inp} text-center px-1`} value={pPeso || ''} onChange={(e) => setPPeso(Number(e.target.value))} min={0} max={300} step={0.5} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">Estatura (cm)</label>
                <input type="number" inputMode="numeric" className={`${inp} text-center px-1`} value={pEstatura || ''} onChange={(e) => setPEstatura(Number(e.target.value))} min={0} max={250} />
              </div>
            </div>
            {(dIMC || dVasos) && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 space-y-1.5">
                {dIMC && <p className="text-sm text-green-800 dark:text-green-300">IMC: <strong>{typeof dIMC === 'number' ? dIMC.toFixed(1) : dIMC}</strong><span className="ml-2 text-xs font-medium bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-0.5 rounded-full">{dCat}</span></p>}
                {dVasos && <p className="text-sm text-green-800 dark:text-green-300">Agua: <strong>~{dVasos} vasos/dia</strong> (~{dAgua?.toFixed(0)} ml)</p>}
              </div>
            )}
            <Button variant={pacienteGuardado ? 'secondary' : 'primary'} size="md" fullWidth onClick={guardarPaciente}>
              {pacienteGuardado ? 'Datos guardados!' : 'Guardar datos'}
            </Button>
          </div>
        </Card>

        <Card icon="" title="Apariencia" color="white">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-lg">{darkMode ? 'Modo Oscuro' : 'Modo Claro'}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{darkMode ? 'Fondo oscuro' : 'Fondo claro'}</p>
            </div>
            <button className={`theme-toggle ${darkMode ? 'active' : ''}`} onClick={toggleDark} aria-label="Cambiar modo oscuro" aria-pressed={darkMode}>
              <span className="theme-toggle__dot" />
            </button>
          </div>
        </Card>

        <Card icon="" title="Notificaciones" color="white">
          <p className="text-gray-600 dark:text-gray-400 mb-3">Permiso: <span className="font-semibold text-gray-800 dark:text-gray-200">{notifStatus}</span></p>
          <div className="flex gap-3">
            <Button variant="primary" size="md" onClick={activarNotif} disabled={notifBusy} className="flex-1">{notifBusy ? 'Procesando...' : 'Activar'}</Button>
            <Button variant="ghost" size="md" onClick={() => { if (typeof window !== 'undefined' && 'Notification' in window) setNotifStatus(Notification.permission); }}>Actualizar</Button>
          </div>
        </Card>

        <Card icon="" title="Recordatorios" color="white">
          {loading ? <p className="text-gray-500 text-sm text-center py-4">Cargando...</p> : items.length === 0 ? <p className="text-gray-400 text-sm text-center py-4">No hay recordatorios</p> : (
            <div className="space-y-3 mb-4">
              {items.map((it) => (
                <div key={it.id} className={`rounded-xl border-2 p-3 flex items-start gap-3 ${it.activo ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">{it.titulo}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{it.cuerpo}</p>
                    <p className="text-sm text-gray-400 mt-1">{it.horario}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button onClick={() => toggleRec(it)} className={`text-sm font-bold px-3 py-1.5 rounded-full min-h-[36px] ${it.activo ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>{it.activo ? 'Activo' : 'Inactivo'}</button>
                    <button onClick={() => removeRec(it.id)} className="text-sm text-red-500 px-2 min-h-[36px]">Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!addOpen ? (
            <button onClick={() => setAddOpen(true)} className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl py-3 text-base font-semibold text-gray-500">+ Agregar recordatorio</button>
          ) : (
            <div className="space-y-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <p className="font-bold text-gray-700 dark:text-gray-200">Nuevo recordatorio</p>
              <div><label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">Titulo</label><input className={inp} value={newTitulo} onChange={(e) => setNewTitulo(e.target.value)} /></div>
              <div><label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">Mensaje</label><input className={inp} value={newCuerpo} onChange={(e) => setNewCuerpo(e.target.value)} /></div>
              <div><label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">Horario</label><input type="time" className={`${inp} w-36`} value={newHorario} onChange={(e) => setNewHorario(e.target.value)} /></div>
              <div className="flex gap-3 pt-1">
                <Button variant="primary" size="md" onClick={addRec} className="flex-1">Guardar</Button>
                <Button variant="ghost" size="md" onClick={() => setAddOpen(false)} className="flex-1">Cancelar</Button>
              </div>
            </div>
          )}
        </Card>

        <div className="text-center py-4">
          <p className="font-bold text-gray-700 dark:text-gray-200 text-lg">Respira Mas</p>
          <p className="text-sm text-gray-400 mt-1">v0.1 - Para uso familiar</p>
        </div>
      </div>
    </>
  );
}