'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
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
  const [items, setItems] = useState<RecConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [newHorario, setNewHorario] = useState('17:00');
  const [newTitulo, setNewTitulo] = useState('🚶 Caminata suave');
  const [newCuerpo, setNewCuerpo] = useState('Hora de tu caminata por intervalos');

  const load = async () => {
    setLoading(true);
    try {
      const cfg = await obtenerRecordatoriosConfig();
      setItems(cfg as RecConfig[]);
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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
    const id = 'rec-' + Date.now();
    const rec = { id, titulo: newTitulo, cuerpo: newCuerpo, horario: newHorario, activo: true } as any;
    await guardarRecordatorioConfig(rec);
    await iniciarRecordatoriosFijos();
    setNewHorario('17:00');
    setNewTitulo('🚶 Caminata suave');
    setNewCuerpo('Hora de tu caminata por intervalos');
    load();
  };

  return (
    <>
      <Header titulo="⚙️ Ajustes" mostrarVolver onVolver={() => { window.history.length > 1 ? history.back() : undefined; }} />

      <div className="p-4 space-y-4">
        <Card title="Recordatorios" icon="🔔" color="white">
          <p className="text-gray-600">Configure horarios de recordatorios; estarán activos cuando la app tenga permiso de notificaciones.</p>
        </Card>

        {loading ? (
          <Card color="white"><p>Cargando...</p></Card>
        ) : (
          <div className="space-y-3">
            {items.map((it) => (
              <Card key={it.id} color={it.activo ? 'green' : 'white'}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold">{it.titulo}</h3>
                    <p className="text-sm text-gray-600">{it.cuerpo}</p>
                    <p className="text-xs text-gray-500">Horario: {it.horario}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Button onClick={() => toggle(it)}>{it.activo ? 'Desactivar' : 'Activar'}</Button>
                    <Button variant="ghost" onClick={() => remove(it.id)}>Eliminar</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Card color="white" title="Añadir recordatorio">
          <div className="space-y-2">
            <input className="w-full p-2 border rounded" value={newTitulo} onChange={(e) => setNewTitulo(e.target.value)} />
            <input className="w-full p-2 border rounded" value={newCuerpo} onChange={(e) => setNewCuerpo(e.target.value)} />
            <input className="w-32 p-2 border rounded" value={newHorario} onChange={(e) => setNewHorario(e.target.value)} />
            <div className="flex gap-2">
              <Button onClick={add}>Agregar</Button>
              <Button variant="ghost" onClick={load}>Cancelar</Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
