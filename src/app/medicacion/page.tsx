'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import AlertBanner from '@/components/ui/AlertBanner';
import {
  obtenerMedicamentos,
  agregarMedicamento,
  actualizarMedicamento,
  eliminarMedicamento,
  obtenerCumplimientoPorFecha,
  obtenerRegistrosPorFechaYTipo,
  registrarCumplimiento,
  fechaHoy,
  sembrarMedicamentos,
  type Medicamento,
  type CumplimientoMedicamento,
} from '@/lib/db';
import historyLib from '@/lib/history';
import { programarRecordatorioDiario, cancelarRecordatorio } from '@/lib/notifications';
import { detectarInteracciones, correspondeHoy, colorCategoria } from '@/lib/medications';

type Tab = 'hoy' | 'gestionar';
type Vista = Tab | 'form';

const FRECUENCIAS = [
  { value: 'daily', label: 'Diario' },
  { value: 'every_other_day', label: 'Dia por medio' },
] as const;

const HORARIOS_RAPIDOS = ['06:00', '08:00', '12:00', '14:00', '20:00', '21:00', '22:00'];

export default function MedicacionPage() {
  const [tab, setTab] = useState<Tab>('hoy');
  const [vista, setVista] = useState<Vista>('hoy');

  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [cumplimiento, setCumplimiento] = useState<CumplimientoMedicamento[]>([]);
  const [interacciones, setInteracciones] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [expandido, setExpandido] = useState<number | null>(null);

  const [editando, setEditando] = useState<Medicamento | null>(null);
  const [fNombre, setFNombre] = useState('');
  const [fDosis, setFDosis] = useState('');
  const [fHorarios, setFHorarios] = useState<string[]>(['08:00']);
  const [fFrecuencia, setFFrecuencia] = useState<'daily' | 'every_other_day'>('daily');
  const [fInstrucciones, setFInstrucciones] = useState('');
  const [fCategoria, setFCategoria] = useState('');
  const [fProposito, setFProposito] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargarDatos = useCallback(async () => {
    const [meds, cum] = await Promise.all([
      obtenerMedicamentos(),
      obtenerCumplimientoPorFecha(fechaHoy()),
    ]);
    setMedicamentos(meds);
    setCumplimiento(cum);
    setInteracciones(
      detectarInteracciones(meds.filter((m) => m.activo).map((m) => m.catalogoId))
    );
  }, []);

  useEffect(() => {
    (async () => {
      setCargando(true);
      try {
        await sembrarMedicamentos();
        await cargarDatos();
      } catch (err) {
        console.error('Error inicializando medicamentos:', err);
      } finally {
        setCargando(false);
      }
    })();
  }, [cargarDatos]);

  const fueTomaRegistrada = (medId: number, horario: string) =>
    cumplimiento.some((c) => c.medicamentoId === medId && c.horario === horario && c.tomado);

  const registrarToma = async (medId: number, horario: string) => {
    await registrarCumplimiento({
      medicamentoId: medId,
      fecha: fechaHoy(),
      horario,
      tomado: true,
      timestamp: Date.now(),
    });
    await cargarDatos();
    try {
      const existentes = await obtenerRegistrosPorFechaYTipo(fechaHoy(), 'medicacion');
      if (!existentes || existentes.length === 0) {
        // registrar un registro diario de tipo 'medicacion' para señalar que hubo toma
        await (await import('@/lib/db')).guardarRegistro({
          fecha: fechaHoy(),
          tipo: 'medicacion',
          datos: { medicamentoId: medId, horario },
          timestamp: Date.now(),
        });
      }
      try {
        await historyLib.addHistory('medicacion tomada', { medicamentoId: medId, horario, fecha: fechaHoy() });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('No se pudo guardar historial de medicacion:', e);
      }
    } catch (err) {
      // no bloquear la UI si falla
      // eslint-disable-next-line no-console
      console.warn('No se pudo registrar el registro de medicacion:', err);
    }
  };

  const medicamentosHoy = medicamentos.filter((m) => {
    if (!m.activo) return false;
    if (m.frecuencia === 'every_other_day') return correspondeHoy();
    return true;
  });

  const horariosHoy = [...new Set(medicamentosHoy.flatMap((m) => m.horarios))].sort();
  const totalTomas = medicamentosHoy.flatMap((m) => m.horarios).length;
  const tomasTomadas = medicamentosHoy.flatMap((m) =>
    m.horarios.filter((h) => fueTomaRegistrada(m.id!, h))
  ).length;
  const porcentaje = totalTomas > 0 ? Math.round((tomasTomadas / totalTomas) * 100) : 0;

  const toggleActivo = async (med: Medicamento) => {
    const actualizado = { ...med, activo: !med.activo };
    await actualizarMedicamento(actualizado);
    if (med.activo && med.id) {
      med.horarios.forEach((h) => cancelarRecordatorio(`med-${med.id}-${h}`));
    } else if (!med.activo && med.id) {
      med.horarios.forEach((h) => {
        programarRecordatorioDiario(
          `med-${med.id}-${h}`,
          'Hora de su medicamento',
          `Tome ${med.nombre} (${med.dosis}) - ${h}`,
          h,
          'medicacion'
        );
      });
    }
    await cargarDatos();
  };

  const borrar = async (med: Medicamento) => {
    if (!med.id) return;
    med.horarios.forEach((h) => cancelarRecordatorio(`med-${med.id}-${h}`));
    await eliminarMedicamento(med.id);
    await cargarDatos();
  };

  const abrirNuevo = () => {
    setEditando(null);
    setFNombre('');
    setFDosis('');
    setFHorarios(['08:00']);
    setFFrecuencia('daily');
    setFInstrucciones('');
    setFCategoria('');
    setFProposito('');
    setVista('form');
  };

  const abrirEditar = (med: Medicamento) => {
    setEditando(med);
    setFNombre(med.nombre);
    setFDosis(med.dosis);
    setFHorarios([...med.horarios]);
    setFFrecuencia(med.frecuencia ?? 'daily');
    setFInstrucciones(med.instrucciones ?? '');
    setFCategoria(med.categoria ?? '');
    setFProposito(med.proposito ?? '');
    setVista('form');
  };

  const guardar = async () => {
    if (!fNombre.trim() || !fDosis.trim()) return;
    setGuardando(true);

    const campos: Omit<Medicamento, 'id'> = {
      nombre: fNombre.trim(),
      dosis: fDosis.trim(),
      horarios: fHorarios,
      activo: editando?.activo ?? true,
      catalogoId: editando?.catalogoId,
      categoria: fCategoria.trim() || undefined,
      proposito: fProposito.trim() || undefined,
      instrucciones: fInstrucciones.trim() || undefined,
      frecuencia: fFrecuencia,
      advertencias: editando?.advertencias,
      efectosSecundarios: editando?.efectosSecundarios,
    };

    if (editando?.id) {
      editando.horarios.forEach((h) => cancelarRecordatorio(`med-${editando.id}-${h}`));
      await actualizarMedicamento({ ...campos, id: editando.id });
      if (campos.activo) {
        fHorarios.forEach((h) => {
          programarRecordatorioDiario(
            `med-${editando.id}-${h}`,
            'Hora de su medicamento',
            `Tome ${campos.nombre} (${campos.dosis}) - ${h}`,
            h,
            'medicacion'
          );
        });
      }
    } else {
      const id = await agregarMedicamento(campos);
      fHorarios.forEach((h) => {
        programarRecordatorioDiario(
          `med-${id}-${h}`,
          'Hora de su medicamento',
          `Tome ${campos.nombre} (${campos.dosis}) - ${h}`,
          h,
          'medicacion'
        );
      });
    }

    await cargarDatos();
    setGuardando(false);
    setVista(tab);
  };

  const agregarHorario = (h = '08:00') => setFHorarios((prev) => [...prev, h]);
  const actualizarHorario = (idx: number, valor: string) => {
    const n = [...fHorarios];
    n[idx] = valor;
    setFHorarios(n);
  };
  const quitarHorario = (idx: number) => {
    if (fHorarios.length <= 1) return;
    setFHorarios(fHorarios.filter((_, i) => i !== idx));
  };

  if (cargando) {
    return (
      <>
        <Header titulo="Medicacion" mostrarVolver />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400 text-lg">Cargando medicamentos...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header titulo="Medicacion" mostrarVolver />
      <div className="p-4 space-y-4 pb-32">

        {vista === 'form' && (
          <>
            <Card
              icon={editando ? '✏️' : '➕'}
              title={editando ? `Editando: ${editando.nombre}` : 'Nuevo medicamento'}
              color="green"
            >
              <p className="text-sm text-gray-600">
                {editando
                  ? 'Modifique los datos y guarde los cambios.'
                  : 'Complete los datos. Recibirá recordatorios a las horas indicadas.'}
              </p>
            </Card>

            <Card color="white">
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Nombre del medicamento *
              </label>
              <input
                type="text"
                value={fNombre}
                onChange={(e) => setFNombre(e.target.value)}
                placeholder="Ej: Furosemida"
                className="w-full text-lg py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none mb-4"
              />

              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Dosis *
              </label>
              <input
                type="text"
                value={fDosis}
                onChange={(e) => setFDosis(e.target.value)}
                placeholder="Ej: 40 mg - 1 pastilla"
                className="w-full text-lg py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none mb-4"
              />

              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Categoria (opcional)
              </label>
              <input
                type="text"
                value={fCategoria}
                onChange={(e) => setFCategoria(e.target.value)}
                placeholder="Ej: Diuretico"
                className="w-full text-base py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none mb-4"
              />

              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Para que sirve (opcional)
              </label>
              <input
                type="text"
                value={fProposito}
                onChange={(e) => setFProposito(e.target.value)}
                placeholder="Ej: Controlar presion arterial"
                className="w-full text-base py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none mb-4"
              />

              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Frecuencia
              </label>
              <div className="flex gap-2 mb-4">
                {FRECUENCIAS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFFrecuencia(f.value)}
                    className={`flex-1 py-2.5 rounded-xl border-2 font-semibold text-sm transition-colors ${
                      fFrecuencia === f.value
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Horarios de toma
              </label>
              {fHorarios.map((h, idx) => (
                <div key={idx} className="flex gap-2 mb-2 items-center">
                  <input
                    type="time"
                    value={h}
                    onChange={(e) => actualizarHorario(idx, e.target.value)}
                    className="flex-1 text-lg py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none"
                  />
                  {fHorarios.length > 1 && (
                    <button
                      onClick={() => quitarHorario(idx)}
                      className="text-red-500 text-xl p-2"
                      aria-label="Quitar horario"
                    >
                      x
                    </button>
                  )}
                </div>
              ))}

              <div className="flex flex-wrap gap-1.5 mb-3 mt-1">
                {HORARIOS_RAPIDOS.filter((h) => !fHorarios.includes(h)).map((h) => (
                  <button
                    key={h}
                    onClick={() => agregarHorario(h)}
                    className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1 rounded-full font-medium"
                  >
                    + {h}
                  </button>
                ))}
              </div>

              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Instrucciones (opcional)
              </label>
              <input
                type="text"
                value={fInstrucciones}
                onChange={(e) => setFInstrucciones(e.target.value)}
                placeholder="Ej: Tomar con comida"
                className="w-full text-base py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none"
              />
            </Card>

            <Button
              fullWidth
              onClick={guardar}
              disabled={!fNombre.trim() || !fDosis.trim() || guardando}
            >
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar medicamento'}
            </Button>
            <Button fullWidth variant="ghost" onClick={() => setVista(tab)}>
              Cancelar
            </Button>
          </>
        )}

        {vista !== 'form' && (
          <>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
              {(['hoy', 'gestionar'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setVista(t); }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    tab === t ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  {t === 'hoy' ? 'Tomas de hoy' : 'Gestionar'}
                </button>
              ))}
            </div>

            {tab === 'hoy' && (
              <>
                {interacciones.map((msg, i) => (
                  <AlertBanner key={i} tipo="advertencia" mensaje={msg} />
                ))}

                {medicamentos.some(
                  (m) => m.activo && m.frecuencia === 'every_other_day' && !correspondeHoy()
                ) && (
                  <AlertBanner
                    tipo="info"
                    mensaje="Los medicamentos de dia por medio no corresponden tomarse hoy."
                  />
                )}

                {totalTomas > 0 && (
                  <div className="rounded-2xl border-2 border-blue-100 bg-blue-50 p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-gray-700">Cumplimiento de hoy</span>
                      <span className="text-2xl font-black text-blue-600">{porcentaje}%</span>
                    </div>
                    <div className="w-full bg-blue-100 rounded-full h-3 mb-1">
                      <div
                        className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      {tomasTomadas} de {totalTomas} tomas registradas
                    </p>
                  </div>
                )}

                {medicamentosHoy.length === 0 && (
                  <Card color="yellow" icon="note">
                    <p className="text-gray-700">
                      No hay medicamentos activos para hoy. Active alguno en Gestionar.
                    </p>
                  </Card>
                )}

                {horariosHoy.map((h) => (
                  <div key={h}>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 mb-2">
                      {h}
                    </p>
                    {medicamentosHoy
                      .filter((m) => m.horarios.includes(h))
                      .map((med) => {
                        const tomado = fueTomaRegistrada(med.id!, h);
                        return (
                          <button
                            key={med.id}
                            onClick={() => !tomado && registrarToma(med.id!, h)}
                            disabled={tomado}
                            className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 mb-2 transition-all text-left ${
                              tomado
                                ? 'bg-green-50 border-green-300 cursor-default'
                                : 'bg-white border-gray-200 hover:border-blue-400'
                            }`}
                          >
                            <span className="text-2xl flex-shrink-0">
                              {tomado ? 'ok' : 'pend'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-800 leading-tight">
                                {med.nombre}
                              </p>
                              <p className="text-sm text-gray-500">{med.dosis}</p>
                              {med.instrucciones && (
                                <p className="text-xs text-blue-600 mt-0.5">
                                  {med.instrucciones}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                              {med.frecuencia === 'every_other_day' && (
                                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                                  dia x medio
                                </span>
                              )}
                              {med.categoria && (
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    colorCategoria[med.categoria] ?? 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  {med.categoria}
                                </span>
                              )}
                              <span
                                className={`text-sm font-semibold ${
                                  tomado ? 'text-green-600' : 'text-gray-400'
                                }`}
                              >
                                {tomado ? 'Tomado' : 'Pendiente'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                ))}
              </>
            )}

            {tab === 'gestionar' && (
              <>
                <div className="flex justify-between items-center px-1">
                  <p className="text-sm text-gray-500">
                    {medicamentos.filter((m) => m.activo).length} activos,{' '}
                    {medicamentos.filter((m) => !m.activo).length} pausados
                  </p>
                  <Button size="sm" variant="secondary" onClick={abrirNuevo}>
                    Nuevo
                  </Button>
                </div>

                {medicamentos.length === 0 && (
                  <Card color="yellow" icon="note">
                    <p className="text-gray-700">
                      No hay medicamentos. Toque Nuevo para agregar.
                    </p>
                  </Card>
                )}

                {medicamentos.map((med) => (
                  <div
                    key={med.id}
                    className={`rounded-2xl border-2 overflow-hidden transition-opacity ${
                      med.activo ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <h3 className="font-bold text-lg text-gray-800 leading-tight">
                              {med.nombre}
                            </h3>
                            {med.categoria && (
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  colorCategoria[med.categoria] ?? 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {med.categoria}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{med.dosis}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {med.horarios.join(' - ')} -{' '}
                            {med.frecuencia === 'every_other_day' ? 'dia por medio' : 'diario'}
                          </p>
                          {med.proposito && (
                            <p className="text-xs text-gray-500 mt-1 italic">{med.proposito}</p>
                          )}
                        </div>

                        <button
                          onClick={() => toggleActivo(med)}
                          className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors ${
                            med.activo ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                          aria-label={med.activo ? 'Desactivar' : 'Activar'}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                              med.activo ? 'translate-x-6' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => abrirEditar(med)}
                          className="flex-1 py-2 rounded-xl border-2 border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setExpandido(expandido === med.id ? null : med.id!)}
                          className="flex-1 py-2 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
                        >
                          {expandido === med.id ? 'Ocultar' : 'Detalles'}
                        </button>
                        <button
                          onClick={() => borrar(med)}
                          className="py-2 px-3 rounded-xl border-2 border-red-100 text-red-500 text-sm hover:bg-red-50 transition-colors"
                          aria-label="Eliminar"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>

                    {expandido === med.id && (
                      <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
                        {med.instrucciones && (
                          <div>
                            <p className="text-xs font-bold text-blue-500 uppercase mb-1">
                              Instrucciones
                            </p>
                            <p className="text-sm text-blue-700">{med.instrucciones}</p>
                          </div>
                        )}
                        {med.advertencias && med.advertencias.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-orange-500 uppercase mb-1">
                              Advertencias
                            </p>
                            <ul className="space-y-1">
                              {med.advertencias.map((a, i) => (
                                <li key={i} className="text-sm text-orange-700 flex gap-1">
                                  <span>-</span><span>{a}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {med.efectosSecundarios && med.efectosSecundarios.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                              Efectos secundarios
                            </p>
                            <p className="text-sm text-gray-600">
                              {med.efectosSecundarios.join(', ')}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                <Button fullWidth variant="ghost" onClick={abrirNuevo}>
                  Agregar medicamento
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
