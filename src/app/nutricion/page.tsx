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

type Seccion = 'menu' | 'alimentos' | 'recetas' | 'evitar' | 'hidratacion' | 'favoritas';

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

/* ── hidratación helpers ── */
const AGUA_KEY = 'nutricion-agua';
function todayStr() { return new Date().toISOString().slice(0, 10); }
function getVasos(): number {
  if (typeof window === 'undefined') return 0;
  try { const p = JSON.parse(localStorage.getItem(AGUA_KEY) || '{}'); return p._date === todayStr() ? (p.vasos ?? 0) : 0; } catch { return 0; }
}
function saveVasos(v: number) {
  if (typeof window !== 'undefined') localStorage.setItem(AGUA_KEY, JSON.stringify({ vasos: v, _date: todayStr() }));
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
  const [vasos, setVasos] = useState(0);
  const [todasFavoritas, setTodasFavoritas] = useState<Receta[]>([]);
  const [cargandoFavs, setCargandoFavs] = useState(false);
  const [pacientePeso, setPacientePeso] = useState(0);

  // Cargar vasos y datos del paciente al inicio
  useEffect(() => {
    setVasos(getVasos());
    try {
      const d = JSON.parse(localStorage.getItem('paciente-datos') || '{}');
      if (d.peso) setPacientePeso(Number(d.peso));
    } catch {}
  }, []);

  // Cargar todas las favoritas cuando se entra a esa sección
  useEffect(() => {
    if (seccion !== 'favoritas') return;
    setCargandoFavs(true);
    (async () => {
      try {
        const [fDes, fAlm, fCen] = await Promise.all([
          obtenerFavoritasPorCategoria('desayuno'),
          obtenerFavoritasPorCategoria('almuerzo'),
          obtenerFavoritasPorCategoria('cena'),
        ]);
        const all: Receta[] = [
          ...((fDes || []).map((f: any) => f.receta)).filter(Boolean),
          ...((fAlm || []).map((f: any) => f.receta)).filter(Boolean),
          ...((fCen || []).map((f: any) => f.receta)).filter(Boolean),
        ];
        setTodasFavoritas(all);
      } catch { setTodasFavoritas([]); }
      finally { setCargandoFavs(false); }
    })();
  }, [seccion]);

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
        setTodasFavoritas((prev) => prev.filter((r) => r.id !== rec.id));
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
      <Header titulo="🥗 Nutrición" mostrarVolver={seccion !== 'menu'} onVolver={() => setSeccion('menu')} />
      <div className="p-4 space-y-4">
        {seccion === 'menu' && (
          <>
            <Card icon="🥗" title="Alimentación saludable" color="green">
              <p className="text-gray-600 text-lg">
                Una buena alimentación es clave para su recuperación. Aquí encontrará guías y recetas pensadas para usted.
              </p>
            </Card>

            {/* Hidratación resumen rápido */}
            <button
              onClick={() => setSeccion('hidratacion')}
              className="w-full bg-blue-50 border-2 border-blue-300 rounded-2xl p-4 flex items-center gap-4 active:scale-95 transition-transform text-left"
            >
              <span className="text-4xl">💧</span>
              <div className="flex-1">
                <p className="text-lg font-bold text-blue-800">Hidratación de Hoy</p>
                <p className="text-base text-blue-600">{vasos} vasos de agua</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-2xl font-black text-blue-700">{vasos}<span className="text-sm font-normal text-blue-400">/7</span></p>
                <div className="flex gap-0.5 mt-1">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < vasos ? 'bg-blue-500' : 'bg-blue-200'}`} />
                  ))}
                </div>
              </div>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setSeccion('alimentos')}
                className="bg-green-50 border-2 border-green-300 rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform">
                <span className="text-4xl">🥬</span>
                <p className="text-base font-bold text-green-800 text-center">Alimentos Recomendados</p>
                <p className="text-sm text-green-600 text-center">Qué comer y por qué ayuda</p>
              </button>
              <button onClick={() => setSeccion('evitar')}
                className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform">
                <span className="text-4xl">🚫</span>
                <p className="text-base font-bold text-red-800 text-center">Alimentos a Evitar</p>
                <p className="text-sm text-red-600 text-center">Qué limitar o eliminar</p>
              </button>
            </div>

            <button onClick={() => setSeccion('recetas')}
              className="w-full bg-emerald-600 text-white rounded-2xl p-5 flex items-center gap-4 active:scale-95 transition-transform">
              <span className="text-4xl">👩‍🍳</span>
              <div className="text-left">
                <p className="text-xl font-bold">Recetas del Día</p>
                <p className="text-emerald-100 text-sm">Generadas por IA según su condición</p>
              </div>
              <span className="ml-auto text-2xl">▶</span>
            </button>

            <button onClick={() => setSeccion('favoritas')}
              className="w-full bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-4 flex items-center gap-4 active:scale-95 transition-transform">
              <span className="text-4xl">★</span>
              <div className="text-left">
                <p className="text-lg font-bold text-yellow-800">Mis Recetas Favoritas</p>
                <p className="text-sm text-yellow-600">Las que más le gustan guardadas</p>
              </div>
              <span className="ml-auto text-2xl text-yellow-400">▶</span>
            </button>
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

        {/* ══════════ HIDRATACIÓN ══════════ */}
        {seccion === 'hidratacion' && (
          <>
            <Card icon="💧" title="Hidratación de Hoy" color="white">
              <p className="text-gray-600">
                La hidratación adecuada cuida su corazón y riñones. Consulte a su médico la cantidad recomendada para su caso.
              </p>
            </Card>

            {/* Contador de vasos */}
            <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-6 text-center">
              <p className="text-blue-700 font-semibold text-base mb-3">Vasos de agua (aprox. 200ml c/u)</p>
              <div className="flex justify-center flex-wrap gap-2 mb-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <button key={i} onClick={() => { const n = i + 1; setVasos(n); saveVasos(n); }}
                    className={`text-3xl transition-transform active:scale-90 ${i < vasos ? 'opacity-100' : 'opacity-20'}`}>
                    💧
                  </button>
                ))}
              </div>
              <p className="text-5xl font-black text-blue-700 mb-1">{vasos}</p>
              <p className="text-blue-600 text-lg font-medium">vasos hoy (~{(vasos * 200 / 1000).toFixed(1)} L)</p>
              <div className="flex gap-4 mt-5 justify-center">
                <button
                  onClick={() => { const n = Math.max(0, vasos - 1); setVasos(n); saveVasos(n); }}
                  className="w-16 h-16 rounded-2xl bg-blue-200 text-blue-800 text-3xl font-black border-2 border-blue-400 active:scale-95 transition-transform"
                >−</button>
                <button
                  onClick={() => { const n = Math.min(10, vasos + 1); setVasos(n); saveVasos(n); }}
                  className="w-16 h-16 rounded-2xl bg-blue-600 text-white text-3xl font-black border-2 border-blue-700 active:scale-95 transition-transform"
                >+</button>
              </div>
            </div>

            {/* Objetivo */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-4">
              <h3 className="font-bold text-gray-800 mb-2 text-lg">📋 Recomendaciones</h3>
              <div className="space-y-2 text-base text-gray-600">
                {pacientePeso > 0 ? (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                      <p className="font-bold text-blue-800">🎯 Objetivo personalizado ({pacientePeso} kg)</p>
                      <p className="text-blue-700 text-sm mt-1">~{Math.round(Math.min(pacientePeso * 25, 1500) / 200)} vasos/día (~{Math.min(pacientePeso * 25, 1500).toFixed(0)} ml)</p>
                      <p className="text-xs text-gray-400 mt-1">Fórmula: 25 ml/kg, máx. 1 500 ml para cardiacos/renales.</p>
                    </div>
                  </>
                ) : (
                  <p>🟢 <strong>Objetivo general:</strong> 6–7 vasos (~1.2–1.4 L/día). Configure su peso en Ajustes para un cálculo personalizado.</p>
                )}
                <p>⚠️ Si tiene retención de líquidos, su médico puede indicar menos.</p>
                <p>💡 Distribuya los vasos durante el día, no todo junto.</p>
                <p>🚫 Evite bebidas con cafeína, alcohol o azúcar añadida.</p>
              </div>
            </div>

            <Button fullWidth variant="ghost" onClick={() => setSeccion('menu')}>
              ← Volver
            </Button>
          </>
        )}

        {/* ══════════ FAVORITAS ══════════ */}
        {seccion === 'favoritas' && (
          <>
            <Card icon="★" title="Mis Recetas Favoritas" color="yellow">
              <p className="text-gray-600">
                Las recetas que marcó como favoritas. Se repiten en la rotación diaria.
              </p>
            </Card>

            {cargandoFavs && (
              <Card color="white">
                <div className="flex items-center justify-center gap-3 py-6">
                  <span className="text-3xl animate-spin">⌛</span>
                  <p className="text-gray-600 text-lg">Cargando favoritas...</p>
                </div>
              </Card>
            )}

            {!cargandoFavs && todasFavoritas.length === 0 && (
              <Card color="white">
                <div className="text-center py-6">
                  <p className="text-5xl mb-3">☆</p>
                  <p className="text-gray-600 text-lg font-medium">No tiene recetas favoritas aún.</p>
                  <p className="text-gray-500 text-base mt-2">Marque recetas con ★ en la sección "Recetas del Día".</p>
                </div>
              </Card>
            )}

            {!cargandoFavs && todasFavoritas.length > 0 && (
              <div className="space-y-4">
                {todasFavoritas.map((receta) => (
                  <TarjetaReceta
                    key={receta.id}
                    receta={receta}
                    isFavorita={true}
                    onToggleFavorita={toggleFavorita}
                  />
                ))}
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
