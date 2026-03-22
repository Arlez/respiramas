'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ALIMENTOS_RECOMENDADOS, ALIMENTOS_EVITAR, type Receta, type AlimentoRecomendado, type AlimentoEvitar } from '@/lib/recipes-ai';
import {
  guardarRecetasIA,
  obtenerRecetasIA,
  fechaHoy,
  limpiarRecetasAntes,
  borrarRecetasFecha,
  guardarFavorita,
  eliminarFavorita,
  obtenerFavoritasPorCategoria,
  esFavorita,
} from '@/lib/db';

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

const MODELO_NOMBRES: Record<string, string> = {
  'google/gemma-3-27b-it:free': 'Gemma 3 27B',
  'z-ai/glm-4.5-air:free': 'GLM 4.5 Air',
  'stepfun/step-3.5-flash:free': 'StepFun 3.5',
};

function TarjetaReceta({ receta, isFavorita, onToggleFavorita }: { receta: Receta; isFavorita?: boolean; onToggleFavorita?: (r: Receta) => void }) {
  const [expandida, setExpandida] = useState(false);

  return (
    <Card color="green" className="relative">
      <div className="absolute top-3 right-3">
        <button
          onClick={() => onToggleFavorita && onToggleFavorita(receta)}
          aria-label={isFavorita ? 'Quitar favorita' : 'Marcar como favorita'}
          className="text-yellow-500 text-lg"
        >
          {isFavorita ? '★' : '☆'}
        </button>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{CATEGORIA_ICONOS[receta.categoria]}</span>
        <span className="text-sm font-medium text-green-600">{CATEGORIA_NOMBRES[receta.categoria]}</span>
        <span className="text-sm text-gray-400 ml-auto">⏱️ {receta.tiempoPreparacion}</span>
      </div>

      <h3 className="text-xl font-bold text-gray-800 mb-1">{receta.nombre}</h3>

      {receta.descripcion && (
        <p className="text-gray-600 text-sm mb-3">{receta.descripcion}</p>
      )}

      <div className="bg-green-50 rounded-xl p-3 border border-green-200 mb-3">
        <h4 className="font-bold text-green-800 mb-1 text-sm">💚 Beneficio para su salud:</h4>
        <p className="text-green-700 text-sm">{receta.beneficio}</p>
      </div>

      <button
        onClick={() => setExpandida(!expandida)}
        className="mt-1 text-green-600 font-semibold text-sm hover:underline"
      >
        {expandida ? '▼ Ocultar ingredientes y preparación' : '▶ Ver ingredientes y preparación'}
      </button>

      {expandida && (
        <div className="mt-3 space-y-3">
          <div>
            <h4 className="font-bold text-gray-700 mb-1">🛒 Ingredientes:</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
              {receta.ingredientes.map((ing, i) => (
                <li key={i}>{ing}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-700 mb-1">👩‍🍳 Preparación:</h4>
            <ol className="list-decimal list-inside text-gray-600 space-y-1 text-sm">
              {receta.preparacion.map((paso, i) => (
                <li key={i}>{paso}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function NutricionPage() {
  const [seccion, setSeccion] = useState<Seccion>('menu');
  const [filtroSistema, setFiltroSistema] = useState<string | null>(null);
  const [recetasHoy, setRecetasHoy] = useState<Receta[]>([]);
  const [modelosUsados, setModelosUsados] = useState<Record<string, string>>({});
  const [cargandoRecetas, setCargandoRecetas] = useState(false);
  const [errorRecetas, setErrorRecetas] = useState<string | null>(null);
  const [selectedCategoria, setSelectedCategoria] = useState<'desayuno' | 'almuerzo' | 'cena' | null>(null);
  const [favoritasIds, setFavoritasIds] = useState<Record<string, boolean>>({});

  // Cargar favoritas cuando se entra a la sección de recetas
  useEffect(() => {
    if (seccion !== 'recetas') return;
    (async () => {
      try {
        const fDes = await obtenerFavoritasPorCategoria('desayuno');
        const fAlm = await obtenerFavoritasPorCategoria('almuerzo');
        const fCen = await obtenerFavoritasPorCategoria('cena');
        const all = [...(fDes || []), ...(fAlm || []), ...(fCen || [])];
        const map: Record<string, boolean> = {};
        all.forEach((f) => { if (f && f.id) map[f.id] = true; });
        setFavoritasIds(map);
      } catch (e) {
        // ignore
      }
    })();
  }, [seccion]);

  // Toggle favorita
  const toggleFavorita = async (rec: Receta) => {
    try {
      if (favoritasIds[rec.id]) {
        await eliminarFavorita(rec.id);
        setFavoritasIds((prev) => {
          const copy = { ...prev };
          delete copy[rec.id];
          return copy;
        });
      } else {
        await guardarFavorita({ id: rec.id, categoria: rec.categoria, receta: rec, addedAt: Date.now() } as any);
        setFavoritasIds((prev) => ({ ...prev, [rec.id]: true }));
      }
    } catch (e) {
      // ignore
    }
  };

  // Cargar recetas para una categoría específica. Primero revisa cache local (IndexedDB) por la fecha actual.
  const cargarRecetasCategoria = useCallback(async (categoria: 'desayuno' | 'almuerzo' | 'cena') => {
    setCargandoRecetas(true);
    setErrorRecetas(null);
    try {
      // Limpiar recetas antiguas (antes de hoy) en segundo plano
      const hoy = fechaHoy();
      limpiarRecetasAntes(hoy).catch(() => {});

      const cached = await obtenerRecetasIA(hoy, categoria);
      if (cached) {
        setRecetasHoy((prev) => [...prev.filter((r) => r.categoria !== categoria), ...(cached as Receta[])]);
        setCargandoRecetas(false);
        return;
      }

      const res = await fetch(`/api/recetas?categoria=${categoria}`);
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(t || 'No se pudieron cargar las recetas');
      }
      const data = await res.json();
      // Soportar respuesta antigua { recetas: [...] } y nueva { receta: {...} }
      const fetchedArr: Receta[] = data.recetas ?? (data.receta ? [data.receta] : []);

      // Cargar favoritas de la categoría y elegir la favorita del día (rotación diaria)
      const favs = await obtenerFavoritasPorCategoria(categoria);
      let firstFav: Receta | null = null;
      if (favs && favs.length > 0) {
        try {
          const key = `rotacion_fav_${categoria}`;
          const lastStr = localStorage.getItem(key);
          const last = lastStr ? parseInt(lastStr, 10) : -1;
          const next = (isNaN(last) ? 0 : ((last + 1) % favs.length));
          localStorage.setItem(key, String(next));
          firstFav = (favs[next] as any).receta ?? null;
        } catch (e) {
          // localStorage puede no estar disponible; fallback al primero
          firstFav = (favs[0] as any).receta ?? null;
        }
      }

      // Eliminar de fetched cualquier receta que esté marcada favorita (para evitar duplicados)
      const favIds = new Set((favs || []).map((f) => f.id));
      const nonFavFetched = fetchedArr.filter((r) => !favIds.has(r.id));

      // Construir lista final: colocar la favorita (si existe) en primer lugar y completar hasta 3
      const finalList: Receta[] = [];
      if (firstFav) finalList.push(firstFav);
      for (const item of nonFavFetched) {
        if (finalList.length >= 3) break;
        finalList.push(item);
      }

      setRecetasHoy((prev) => [...prev.filter((r) => r.categoria !== categoria), ...finalList]);
      setModelosUsados((prev) => ({ ...prev, [categoria]: data.modelo ?? prev[categoria] }));

      // Guardar en cache local para el resto del día (guardar lo que trajo la IA/fetch)
      await guardarRecetasIA(hoy, categoria, fetchedArr);
    } catch (e) {
      setErrorRecetas(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setCargandoRecetas(false);
    }
  }, []);

  useEffect(() => {
    // No auto-generate al entrar; el usuario elige la categoría.
    if (seccion !== 'recetas') {
      setSelectedCategoria(null);
    }
  }, [seccion]);

  const alimentosFiltrados = filtroSistema
    ? ALIMENTOS_RECOMENDADOS.filter((a) => a.sistemas.includes(filtroSistema as 'corazón' | 'pulmón' | 'riñón' | 'sangre'))
    : ALIMENTOS_RECOMENDADOS;

  return (
    <>
      <Header titulo="🥗 Nutrición" mostrarVolver onVolver={() => setSeccion('menu')} />
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
              👩‍🍳 Recetas del Día
            </Button>
            <p className="text-gray-500 text-center text-sm">
              9 recetas generadas por IA según su condición
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
            <Card icon="👩‍🍳" title="Recetas del día" color="green">
              <p className="text-gray-600">
                9 recetas generadas por IA, adaptadas a su condición: bajas en sal, ricas en hierro y antiinflamatorias.
              </p>
            </Card>

            {cargandoRecetas && (
              <Card color="white">
                <div className="flex items-center justify-center gap-3 py-6">
                  <span className="text-3xl animate-spin">⌛</span>
                  <p className="text-gray-600 text-lg">Generando recetas personalizadas...</p>
                </div>
              </Card>
            )}

            {errorRecetas && (
              <Card color="red">
                <p className="text-red-700 mb-3">⚠️ {errorRecetas}</p>
                <button
                  onClick={() => selectedCategoria && cargarRecetasCategoria(selectedCategoria)}
                  className="w-full py-2 font-semibold text-red-700 border border-red-400 rounded-xl"
                >
                  🔄 Reintentar
                </button>
              </Card>
            )}

            {!cargandoRecetas && !errorRecetas && (
              <>
                <div className="flex flex-col gap-3">
                  <Button fullWidth onClick={async () => { setSelectedCategoria('desayuno'); await cargarRecetasCategoria('desayuno'); }}>
                    🌅 Desayuno
                  </Button>
                  <Button fullWidth onClick={async () => { setSelectedCategoria('almuerzo'); await cargarRecetasCategoria('almuerzo'); }}>
                    ☀️ Almuerzo
                  </Button>
                  <Button fullWidth onClick={async () => { setSelectedCategoria('cena'); await cargarRecetasCategoria('cena'); }}>
                    🌙 Cena
                  </Button>
                </div>

                {selectedCategoria && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between pt-2">
                      <h2 className="text-xl font-bold text-gray-700 flex items-center gap-2">
                        {CATEGORIA_ICONOS[selectedCategoria]} {CATEGORIA_NOMBRES[selectedCategoria]}
                      </h2>
                    </div>
                    <div className="mt-4 space-y-4">
                      {recetasHoy.filter((r) => r.categoria === selectedCategoria).map((receta) => (
                        <TarjetaReceta key={receta.id} receta={receta} isFavorita={!!favoritasIds[receta.id]} onToggleFavorita={toggleFavorita} />
                      ))}
                    </div>

                    
                  </div>
                )}
              </>
            )}

            <Card icon="🤖" color="yellow">
              <p className="text-gray-700 text-sm">
                Recetas generadas en paralelo por 3 modelos de IA, adaptadas a su condición. Consulte a su nutricionista antes de cambios importantes en su dieta.
              </p>
            </Card>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-3">
                <Button
                  fullWidth
                  variant="ghost"
                  onClick={async () => {
                    const hoy = fechaHoy();
                    try {
                      await borrarRecetasFecha(hoy);
                      setRecetasHoy([]);
                      setSelectedCategoria(null);
                      // feedback simple en dev
                      // eslint-disable-next-line no-alert
                      alert('Recetas del día reiniciadas (dev)');
                    } catch (e) {
                      // eslint-disable-next-line no-alert
                      alert('Error al reiniciar recetas: ' + (e instanceof Error ? e.message : String(e)));
                    }
                  }}
                >
                  DEV: Reiniciar recetas del día
                </Button>
              </div>
            )}

            <Button fullWidth variant="ghost" onClick={() => setSeccion('menu')}>
              ← Volver
            </Button>
          </>
        )}
      </div>
    </>
  );
}
