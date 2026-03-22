'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { obtenerMedicamentos, actualizarMedicamento, guardarRecordatorioConfig, obtenerRecordatoriosConfig, sembrarMedicamentos, openDB, verificarYRecrearDB } from '@/lib/db';
import { initialMedications } from '@/lib/initialMedications';
import { iniciarRecordatoriosFijos } from '@/lib/notifications';

type Item = {
  id: string;
  tipo: 'medicamento' | 'recordatorio' | 'comida';
  titulo: string;
  descripcion?: string;
  horario: string; // HH:MM
};

const MEAL_DEFAULTS: Item[] = [
  { id: 'meal-desayuno', tipo: 'comida', titulo: 'Desayuno', horario: '10:00' },
  { id: 'meal-almuerzo', tipo: 'comida', titulo: 'Almuerzo', horario: '15:00' },
  { id: 'meal-once', tipo: 'comida', titulo: 'Once', horario: '20:00' },
];

function timeToMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function bloqueFromTime(hhmm: string) {
  const mins = timeToMinutes(hhmm);
  if (mins >= 300 && mins < 12 * 60) return 'Mañana'; // 05:00-11:59
  if (mins >= 12 * 60 && mins < 18 * 60) return 'Tarde'; // 12:00-17:59
  return 'Noche'; // 18:00-04:59
}

export default function PlanificacionPage() {
  const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [doneIds, setDoneIds] = useState<Record<string, boolean>>({});

    useEffect(() => {
      (async () => {
        setLoading(true);
        try {
          // Verificar y recrear la base de datos si falta alguna store
          await verificarYRecrearDB();

          // Sembrar datos iniciales
          await sembrarMedicamentos();
          await iniciarRecordatoriosFijos();

          // Cargar medicamentos y recordatorios
          let meds = await obtenerMedicamentos();
          // Si no hay medicamentos en la DB, usar los iniciales (seed)
          if (!meds || meds.length === 0) {
            meds = initialMedications.map((im) => ({
              id: undefined,
              catalogoId: im.id,
              nombre: im.name,
              dosis: im.dosage,
              horarios: im.schedule?.times ?? [],
              activo: im.active,
            } as any));
          }

          const medItems: Item[] = [];
          meds.forEach((m: any) => {
            // soportar distintas formas: 'horarios' o 'schedule.times'
            const horarios: string[] = m.horarios ?? m.schedule?.times ?? [];
            horarios.forEach((h) => {
              const hh = String(h).padStart(4, '0');
              // normalizar a HH:MM
              const formatted = hh.includes(':') ? hh.slice(0,5) : `${hh.slice(0,-2).padStart(2,'0')}:${hh.slice(-2)}`;
              medItems.push({
                id: `med-${m.id}-${formatted}`,
                tipo: 'medicamento',
                titulo: m.nombre,
                descripcion: `${m.dosis || ''}`,
                horario: formatted,
              });
            });
          });

          const recs = await obtenerRecordatoriosConfig();
          const recItems: Item[] = (recs || []).map((r: any) => ({
            id: `rec-${r.id}`,
            tipo: 'recordatorio',
            titulo: r.titulo,
            descripcion: r.cuerpo,
            horario: r.horario,
          }));

          const combined = [...MEAL_DEFAULTS, ...medItems, ...recItems];
          // normalize horarios: ensure HH:MM
          const normalized = combined.filter((it) => !!it.horario).map((it) => ({ ...it, horario: it.horario.slice(0,5) }));

          // sort by time
          normalized.sort((a, b) => timeToMinutes(a.horario) - timeToMinutes(b.horario));

          setItems(normalized);
        } catch (e) {
          console.error('Error cargando Planificación:', e);
          setItems(MEAL_DEFAULTS);
        } finally {
          setLoading(false);
        }
      })();
    }, []);

    

    const bloques = ['Mañana', 'Tarde', 'Noche'];

    // helpers for grouping
    function groupByHorario(list: Item[]) {
      const map: Record<string, Item[]> = {};
      list.forEach((it) => {
        const k = it.horario || '00:00';
        if (!map[k]) map[k] = [];
        map[k].push(it);
      });
      return map;
    }

    const startEdit = (id: string, horario: string) => { setEditingId(id); setEditValue(horario); };
    const cancelEdit = () => { setEditingId(null); setEditValue(''); };

    const saveEdit = async (item: Item) => {
      const newHorario = editValue;
      // update local state
      setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, horario: newHorario } : p)));

      try {
        if (item.tipo === 'recordatorio') {
          const origId = item.id.replace(/^rec-/, '');
          const configs = await obtenerRecordatoriosConfig();
          const cfg = (configs || []).find((c: any) => String(c.id) === String(origId));
          if (cfg) {
            const updated = { ...cfg, horario: newHorario };
            await guardarRecordatorioConfig(updated as any);
          }
        }

        if (item.tipo === 'medicamento') {
          // item.id is like med-<base>-HH:MM, base may contain dashes
          const parts = item.id.split('-');
          const base = parts.slice(1, parts.length - 1).join('-');
          const meds = await obtenerMedicamentos();
          const med = (meds || []).find((m: any) => String(m.id) === String(base) || String(m.catalogoId) === String(base) || String(m.nombre) === String(item.titulo));
          if (med) {
            const horarios: string[] = (med as any).horarios ?? (med as any).schedule?.times ?? [];
            const replaced = horarios.map((h: string) => (String(h).slice(0,5) === item.horario ? newHorario : h));
            const updatedMed = { ...med, horarios: replaced };
            try { await actualizarMedicamento(updatedMed as any); } catch (e) { /* ignore */ }
          }
        }
      } catch (e) {
        // ignore persistence errors
      }

      cancelEdit();
    };

    const toggleDone = (id: string) => {
      setDoneIds((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    return (
      <>
        <Header titulo="🗓️ Planificación" mostrarVolver />
        <div className="p-4 space-y-4">
          <Card color="white" title="Plan del día">
            <p className="text-gray-600">Aquí verás todo lo programado y las acciones con horario: medicación, recordatorios y comidas.</p>
          </Card>

          {loading ? (
            <Card color="white"><p>Cargando...</p></Card>
          ) : (
            bloques.map((b) => {
              const list = items.filter((it) => bloqueFromTime(it.horario) === b);
              const grouped = groupByHorario(list);
              const keys = Object.keys(grouped).sort((a, c) => timeToMinutes(a) - timeToMinutes(c));
              return (
                <div key={b}>
                  <h2 className="text-lg font-bold mb-2">{b}</h2>
                  {list.length === 0 ? (
                    <Card color="white"><p className="text-gray-600">No hay eventos</p></Card>
                  ) : (
                    <div className="space-y-4">
                      {keys.map((hora) => (
                        <div key={hora}>
                          <div className="space-y-2">
                            {grouped[hora].map((it) => (
                              <Card key={it.id} color={it.tipo === 'medicamento' ? 'yellow' : it.tipo === 'recordatorio' ? 'green' : 'white'}>
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex-1">
                                    <h4 className="font-bold">{it.titulo}</h4>
                                    {it.descripcion && <p className="text-sm text-gray-600">{it.descripcion}</p>}
                                    <p className="text-xs text-gray-500">{it.tipo}</p>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {editingId === it.id ? (
                                      <input type="time" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="p-1 border rounded w-24 md:w-28" />
                                    ) : (
                                      <div className="text-sm text-gray-700">{it.horario}</div>
                                    )}
                                  </div>
                                </div>

                                {editingId === it.id && (
                                  <div className="mt-3 flex gap-2">
                                    <Button fullWidth size="md" onClick={() => saveEdit(it)}>Guardar</Button>
                                    <Button fullWidth size="md" variant="ghost" onClick={cancelEdit}>Cancelar</Button>
                                  </div>
                                )}
                                {editingId !== it.id && (
                                  <div className="mt-3 flex justify-end gap-2">
                                    <button onClick={() => startEdit(it.id, it.horario)} className="text-sm text-gray-600 px-2 py-1 hover:bg-gray-100 rounded">Editar</button>
                                    <Button size="md" variant="ghost" onClick={() => toggleDone(it.id)}>{doneIds[it.id] ? 'Deshacer' : 'Hecho'}</Button>
                                  </div>
                                )}
                              </Card>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </>
    );
  }

