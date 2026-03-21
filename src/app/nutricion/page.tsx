'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { generarRecetasDiarias, ALIMENTOS_RECOMENDADOS, ALIMENTOS_EVITAR, type Receta, type AlimentoRecomendado, type AlimentoEvitar } from '@/lib/recipes-ai';

type Seccion = 'menu' | 'alimentos' | 'recetas' | 'evitar';

const SISTEMA_COLORES: Record<string, string> = {
  'corazón': 'bg-red-100 text-red-700',
  'pulmón': 'bg-blue-100 text-blue-700',
  'riñón': 'bg-yellow-100 text-yellow-700',
  'sangre': 'bg-purple-100 text-purple-700',
};

const SISTEMA_ICONOS: Record<string, string> = {
  'corazón': '❤️',
  'pulmón': '🫁',
  'riñón': '🫘',
  'sangre': '🩸',
};

const CATEGORIA_ICONOS: Record<string, string> = {
  desayuno: '🌅',
  almuerzo: '☀️',
  cena: '🌙',
};

const CATEGORIA_NOMBRES: Record<string, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  cena: 'Cena',
};

function BadgeSistema({ sistema }: { sistema: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${SISTEMA_COLORES[sistema] || 'bg-gray-100'}`}>
      {SISTEMA_ICONOS[sistema]} {sistema}
    </span>
  );
}

function TarjetaEvitar({ alimento }: { alimento: AlimentoEvitar }) {
  return (
    <Card color="red">
      <div className="flex items-start gap-3">
        <span className="text-3xl">{alimento.icono}</span>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-red-700">{alimento.nombre}</h3>
          <p className="text-gray-600 mt-1 text-sm">{alimento.razon}</p>
        </div>
        <span className="text-xl">⚠️</span>
      </div>
    </Card>
  );
}

function TarjetaAlimento({ alimento }: { alimento: AlimentoRecomendado }) {
  return (
    <Card color="white">
      <div className="flex items-start gap-3">
        <span className="text-4xl">{alimento.icono}</span>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-800">{alimento.nombre}</h3>
          <p className="text-gray-600 mt-1">{alimento.beneficio}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {alimento.sistemas.map((s) => (
              <BadgeSistema key={s} sistema={s} />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function TarjetaReceta({ receta }: { receta: Receta }) {
  const [expandida, setExpandida] = useState(false);

  return (
    <Card color="green">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{CATEGORIA_ICONOS[receta.categoria]}</span>
        <span className="text-sm font-medium text-green-600">{CATEGORIA_NOMBRES[receta.categoria]}</span>
        <span className="text-sm text-gray-400 ml-auto">⏱️ {receta.tiempoPreparacion}</span>
      </div>

      <h3 className="text-xl font-bold text-gray-800">{receta.nombre}</h3>

      <button
        onClick={() => setExpandida(!expandida)}
        className="mt-2 text-green-600 font-semibold text-lg hover:underline"
      >
        {expandida ? '▼ Ocultar detalle' : '▶ Ver receta completa'}
      </button>

      {expandida && (
        <div className="mt-3 space-y-3">
          <div>
            <h4 className="font-bold text-gray-700 mb-1">🛒 Ingredientes:</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              {receta.ingredientes.map((ing, i) => (
                <li key={i}>{ing}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-700 mb-1">👩‍🍳 Preparación:</h4>
            <ol className="list-decimal list-inside text-gray-600 space-y-1">
              {receta.preparacion.map((paso, i) => (
                <li key={i}>{paso}</li>
              ))}
            </ol>
          </div>

          <div className="bg-green-100 rounded-xl p-3 border border-green-300">
            <h4 className="font-bold text-green-800 mb-1">💚 Beneficio para su salud:</h4>
            <p className="text-green-700">{receta.beneficio}</p>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function NutricionPage() {
  const [seccion, setSeccion] = useState<Seccion>('menu');
  const [filtroSistema, setFiltroSistema] = useState<string | null>(null);
  const recetasHoy = generarRecetasDiarias();

  const alimentosFiltrados = filtroSistema
    ? ALIMENTOS_RECOMENDADOS.filter((a) => a.sistemas.includes(filtroSistema as 'corazón' | 'pulmón' | 'riñón' | 'sangre'))
    : ALIMENTOS_RECOMENDADOS;

  return (
    <>
      <Header titulo="🥗 Nutrición" mostrarVolver />
      <div className="p-4 space-y-4">
        {seccion === 'menu' && (
          <>
            <Card icon="🥗" title="Alimentación saludable" color="green">
              <p className="text-gray-600 text-lg">
                Una buena alimentación es clave para su recuperación. Aquí encontrará guías y recetas pensadas para usted.
              </p>
            </Card>

            <Button fullWidth onClick={() => setSeccion('alimentos')}>
              🥬 Alimentos Recomendados
            </Button>
            <p className="text-gray-500 text-center text-sm">
              Qué comer y por qué le ayuda
            </p>

            <Button fullWidth variant="secondary" onClick={() => setSeccion('recetas')}>
              👩‍🍳 Recetas del Día (IA)
            </Button>
            <p className="text-gray-500 text-center text-sm">
              3 recetas generadas según su condición
            </p>

            <Button fullWidth variant="secondary" onClick={() => setSeccion('evitar')}>
              🚫 Alimentos a Evitar
            </Button>
            <p className="text-gray-500 text-center text-sm">
              Alimentos que debe evitar o limitar
            </p>
          </>
        )}

        {seccion === 'alimentos' && (
          <>
            <Card icon="🥬" title="Alimentos recomendados" color="green">
              <p className="text-gray-600">
                Estos alimentos son especialmente buenos para su condición. Filtre por sistema:
              </p>
            </Card>

            {/* Filtros */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFiltroSistema(null)}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  !filtroSistema ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Todos
              </button>
              {Object.entries(SISTEMA_ICONOS).map(([sistema, icono]) => (
                <button
                  key={sistema}
                  onClick={() => setFiltroSistema(sistema)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                    filtroSistema === sistema ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {icono} {sistema}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {alimentosFiltrados.map((alimento) => (
                <TarjetaAlimento key={alimento.nombre} alimento={alimento} />
              ))}
            </div>

            <Button fullWidth variant="ghost" onClick={() => setSeccion('menu')}>
              ← Volver
            </Button>
          </>
        )}

        {seccion === 'evitar' && (
          <>
            <Card icon="🚫" title="Alimentos a evitar" color="red">
              <p className="text-gray-600">
                Estos alimentos pueden perjudicar su corazón, riñones o pulmones. Evítelos o consúmalos muy raramente.
              </p>
            </Card>

            <div className="space-y-3">
              {ALIMENTOS_EVITAR.map((alimento) => (
                <TarjetaEvitar key={alimento.nombre} alimento={alimento} />
              ))}
            </div>

            <Button fullWidth variant="ghost" onClick={() => setSeccion('menu')}>
              ← Volver
            </Button>
          </>
        )}

        {seccion === 'recetas' && (
          <>
            <Card icon="👩‍🍳" title="Recetas de hoy" color="green">
              <p className="text-gray-600">
                3 recetas generadas automáticamente, adaptadas a su condición: baja en sal, rica en hierro, antiinflamatoria.
              </p>
            </Card>

            <div className="space-y-4">
              {recetasHoy.map((receta) => (
                <TarjetaReceta key={receta.id} receta={receta} />
              ))}
            </div>

            <Card icon="🤖" color="yellow">
              <p className="text-gray-700 text-sm">
                Estas recetas son generadas automáticamente con criterios de salud. Consulte a su nutricionista antes de cambios importantes en su dieta.
              </p>
            </Card>

            <Button fullWidth variant="ghost" onClick={() => setSeccion('menu')}>
              ← Volver
            </Button>
          </>
        )}
      </div>
    </>
  );
}
