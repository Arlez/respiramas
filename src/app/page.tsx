'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import AlertBanner from '@/components/ui/AlertBanner';
import {
  obtenerRegistrosPorFecha,
  obtenerAlertasNoLeidas,
  obtenerMedicamentos,
  obtenerCumplimientoPorFecha,
  fechaHoy,
  marcarAlertaLeida,
  type Alerta,
  type RegistroDiario,
} from '@/lib/db';
import { correspondeHoy } from '@/lib/medications';

interface ModuloAcceso {
  href: string;
  nombre: string;
  icono: string;
  descripcion: string;
  color: string;
}

const MODULOS: ModuloAcceso[] = [
  { href: '/respiratorio', nombre: 'Respiratorio', icono: '🫁', descripcion: 'Ejercicios respiratorios', color: 'bg-blue-50 border-blue-200 hover:bg-blue-100' },
  { href: '/ejercicio', nombre: 'Ejercicio', icono: '🚶', descripcion: 'Caminata por intervalos', color: 'bg-green-50 border-green-200 hover:bg-green-100' },
  { href: '/cardiorrenal', nombre: 'Corazón y Riñón', icono: '❤️', descripcion: 'Peso, presión, frecuencia', color: 'bg-red-50 border-red-200 hover:bg-red-100' },
  { href: '/energia', nombre: 'Energía', icono: '⚡', descripcion: 'Fatiga y anemia', color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' },
  { href: '/medicacion', nombre: 'Medicación', icono: '💊', descripcion: 'Control de medicamentos', color: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100' },
  { href: '/nutricion', nombre: 'Nutrición', icono: '🥗', descripcion: 'Alimentos y recetas', color: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100' },
  { href: '/mental', nombre: 'Mente', icono: '🧘', descripcion: 'Relajación y bienestar', color: 'bg-purple-50 border-purple-200 hover:bg-purple-100' },
  { href: '/planificacion', nombre: 'Planificación', icono: '🗓️', descripcion: 'Horario diario: medicación, ejercicio, comidas', color: 'bg-gray-50 border-gray-200 hover:bg-gray-100' },
];

const CONSEJOS = [
  'Recuerde tomar agua a lo largo del día. La hidratación ayuda a sus riñones y pulmones.',
  'Practique sus ejercicios respiratorios al menos una vez al día. Pequeños avances dan grandes resultados.',
  'Camine a su ritmo. Si siente fatiga, descanse sin culpa. Escuche a su cuerpo.',
  'Los alimentos ricos en hierro (espinaca, lentejas) son sus aliados contra la anemia.',
  'Lleve un registro diario: su médico agradecerá tener datos concretos en la próxima consulta.',
  'Reducir la sal protege su corazón y riñones. Use hierbas y especias para dar sabor.',
  'Un momento de relajación al día reduce la ansiedad y mejora su presión arterial.',
  'No olvide sus medicamentos. La constancia es clave en el tratamiento.',
  'Si su saturación baja de 88%, siéntese y respire con labios fruncidos. Si no mejora, llame a su médico.',
  'Celebre cada pequeño logro. Hacer sus ejercicios hoy ya es un gran paso.',
];

const TIPOS = ['respiratorio', 'ejercicio', 'cardiorrenal', 'energia', 'medicacion', 'mental'] as const;

export default function HomePage() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [registrosHoy, setRegistrosHoy] = useState<RegistroDiario[]>([]);
  const [medsPendientes, setMedsPendientes] = useState(0);

  useEffect(() => {
    async function cargar() {
      const hoy = fechaHoy();
      const [als, regs, meds, cumplimiento] = await Promise.all([
        obtenerAlertasNoLeidas(),
        obtenerRegistrosPorFecha(hoy),
        obtenerMedicamentos(),
        obtenerCumplimientoPorFecha(hoy),
      ]);
      setAlertas(als);
      setRegistrosHoy(regs);

      const totalTomas = meds
        .filter((m) => m.activo)
        .filter((m) => (m.frecuencia === 'every_other_day' ? correspondeHoy() : true))
        .reduce((acc, m) => acc + (m.horarios?.length ?? 0), 0);
      const tomadasHoy = cumplimiento.filter((c) => c.tomado).length;
      setMedsPendientes(totalTomas - tomadasHoy);
    }
    cargar();
  }, []);

  const descartarAlerta = async (alerta: Alerta) => {
    await marcarAlertaLeida(alerta);
    setAlertas((prev) => prev.filter((a) => a.id !== alerta.id));
  };

  const tiposRegistrados = new Set(registrosHoy.map((r) => r.tipo));
  const horaActual = new Date().getHours();
  const saludo = horaActual < 12 ? 'Buenos días' : horaActual < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="p-4 space-y-4">
      {/* Saludo */}
      <div className="bg-green-600 text-white rounded-2xl p-5 shadow-md">
        <h1 className="text-2xl font-bold">{saludo} 👋</h1>
        <p className="text-green-100 text-lg mt-1">Respira Más — Su guía de salud diaria</p>
        <p className="text-green-200 text-sm mt-2">
          📅 {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Alertas activas */}
      {alertas.map((alerta) => (
        <AlertBanner
          key={alerta.id}
          tipo={alerta.tipo === 'critica' ? 'critica' : alerta.tipo === 'advertencia' ? 'advertencia' : 'info'}
          mensaje={alerta.mensaje}
          onClose={() => descartarAlerta(alerta)}
        />
      ))}

      {/* Resumen del día */}
      <Card icon="📊" title="Hoy" color="white">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Registros completados</span>
            <span className="font-bold text-lg">{tiposRegistrados.size} / {TIPOS.length}</span>
          </div>
          <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-green-500 h-full transition-all"
              style={{ width: `${(tiposRegistrados.size / 5) * 100}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {TIPOS.map((tipo) => (
              <span
                key={tipo}
                className={`px-2 py-1 rounded-lg text-sm ${
                  tiposRegistrados.has(tipo) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {tiposRegistrados.has(tipo) ? '✅' : '⬜'} {tipo}
              </span>
            ))}
          </div>
          {medsPendientes > 0 && (
            <p className="text-orange-600 font-medium mt-2">
              💊 {medsPendientes} toma{medsPendientes !== 1 ? 's' : ''} de medicamento{medsPendientes !== 1 ? 's' : ''} pendiente{medsPendientes !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </Card>

      {/* Módulos */}
      <h2 className="text-xl font-bold text-gray-800 pt-2">Módulos</h2>
      <div className="grid grid-cols-2 gap-3">
        {MODULOS.map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className={`${mod.color} border-2 rounded-2xl p-4 text-center transition-colors block`}
          >
            <span className="text-4xl block mb-2">{mod.icono}</span>
            <span className="font-bold text-gray-800 block">{mod.nombre}</span>
            <span className="text-sm text-gray-500">{mod.descripcion}</span>
          </Link>
        ))}
      </div>

      {/* Consejo del día */}
      <Card icon="💡" title="Consejo del día" color="yellow">
        <p className="text-gray-700">
          {CONSEJOS[new Date().getDate() % CONSEJOS.length]}
        </p>
      </Card>
    </div>
  );
}
