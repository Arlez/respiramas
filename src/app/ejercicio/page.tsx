'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Header from '@/components/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import NumberInput from '@/components/ui/NumberInput';
import SliderInput from '@/components/ui/SliderInput';
import AlertBanner from '@/components/ui/AlertBanner';
import { guardarRegistro, fechaHoy } from '@/lib/db';
import historyLib from '@/lib/history';
import { evaluarSpO2, evaluarFatiga, procesarAlerta, calcularIntensidadRecomendada } from '@/lib/rules';
import { ensureAudioUnlocked, playStartSound, playRestSound } from '@/lib/sounds';

type Fase = 'menu' | 'caminata' | 'sentadillas' | 'talones' | 'brazos' | 'registro';
type Intervalo = 'caminar' | 'descanso';
type TipoPaso = 'activo' | 'descanso' | 'preparacion' | 'alerta';

interface ConfigCaminata {
  tiempoCaminar: number; // segundos
  tiempoDescanso: number;
  repeticiones: number;
}

interface PasoEjercicio {
  instruccion: string;
  duracion: number; // segundos
  tipo: TipoPaso;
}

const CONFIG_NORMAL: ConfigCaminata = { tiempoCaminar: 120, tiempoDescanso: 120, repeticiones: 4 };
const CONFIG_REDUCIDA: ConfigCaminata = { tiempoCaminar: 90, tiempoDescanso: 150, repeticiones: 3 };

// ── Sentadillas ────────────────────────────────────────────────────────────
// ── Sentadillas (ajustado) ────────────────────────────────────────────────
const EJERCICIO_SENTADILLAS: PasoEjercicio[] = [
  { instruccion: 'Colóquese de pie frente a una silla resistente. Pies separados al ancho de los hombros.', duracion: 6, tipo: 'preparacion' },
  { instruccion: 'Apoye las manos en la silla o en sus muslos para mayor estabilidad.', duracion: 5, tipo: 'preparacion' },
  { instruccion: '🛑 Si siente mareo o falta de aire, deténgase y descanse.', duracion: 5, tipo: 'alerta' },

  // Serie 1 (5 reps)
  { instruccion: '🦵 Baje lentamente hacia la silla. INHALE al bajar.', duracion: 4, tipo: 'activo' },
  { instruccion: '🦵 Suba lentamente. EXHALE al subir con labios fruncidos.', duracion: 4, tipo: 'activo' },
  { instruccion: '🦵 Baje... INHALE...', duracion: 4, tipo: 'activo' },
  { instruccion: '🦵 Suba... EXHALE...', duracion: 4, tipo: 'activo' },
  { instruccion: '🦵 Baje... INHALE...', duracion: 4, tipo: 'activo' },
  { instruccion: '🦵 Suba... EXHALE...', duracion: 4, tipo: 'activo' },
  { instruccion: '🦵 Última repetición. Baje... INHALE...', duracion: 4, tipo: 'activo' },
  { instruccion: '🦵 Suba... EXHALE...', duracion: 4, tipo: 'activo' },

  { instruccion: '✨ Descanse. Respire con calma.', duracion: 12, tipo: 'descanso' },

  // Serie 2 (5 reps)
  { instruccion: '🦵 Segunda serie. Baje... INHALE...', duracion: 4, tipo: 'activo' },
  { instruccion: '🦵 Suba... EXHALE...', duracion: 4, tipo: 'activo' },
  { instruccion: '🦵 Baje... INHALE...', duracion: 4, tipo: 'activo' },
  { instruccion: '🦵 Suba... EXHALE...', duracion: 4, tipo: 'activo' },
  { instruccion: '🦵 Baje... INHALE...', duracion: 4, tipo: 'activo' },
  { instruccion: '🦵 Suba... EXHALE...', duracion: 4, tipo: 'activo' },
  { instruccion: '🦵 Última repetición. Baje... INHALE...', duracion: 4, tipo: 'activo' },
  { instruccion: '🦵 Suba por última vez... EXHALE...', duracion: 4, tipo: 'activo' },

  { instruccion: '✅ Muy bien. Siéntese y descanse.', duracion: 6, tipo: 'descanso' },
];


// ── Elevación de talones (ajustado) ───────────────────────────────────────
const EJERCICIO_TALONES: PasoEjercicio[] = [
  { instruccion: 'Párese detrás de una silla o frente a una pared para apoyarse.', duracion: 6, tipo: 'preparacion' },
  { instruccion: 'Mantenga la espalda recta y los hombros relajados.', duracion: 5, tipo: 'preparacion' },
  { instruccion: '🛑 Si siente mareo o fatiga, deténgase.', duracion: 5, tipo: 'alerta' },

  // Serie 1 (5 reps)
  { instruccion: '🦶 Suba a puntillas. INHALE.', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Baje lentamente. EXHALE.', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Suba... INHALE...', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Baje... EXHALE...', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Suba... INHALE...', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Baje... EXHALE...', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Suba... INHALE...', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Baje... EXHALE...', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Última repetición. Suba... INHALE...', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Baje... EXHALE...', duracion: 3, tipo: 'activo' },

  { instruccion: '✨ Descanse. Respire.', duracion: 10, tipo: 'descanso' },

  // Serie 2 (5 reps)
  { instruccion: '🦶 Segunda serie. Suba... INHALE...', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Baje... EXHALE...', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Suba... INHALE...', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Baje... EXHALE...', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Suba... INHALE...', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Baje... EXHALE...', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Suba... INHALE...', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Baje... EXHALE...', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Última repetición. Suba por última vez... INHALE...', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Baje... EXHALE...', duracion: 3, tipo: 'activo' },

  { instruccion: '✅ Ejercicio completado. Descanse.', duracion: 6, tipo: 'descanso' },
];


// ── Ejercicio de brazos (ajustado) ────────────────────────────────────────
const EJERCICIO_BRAZOS: PasoEjercicio[] = [
  { instruccion: 'Siéntese con la espalda recta y pies apoyados en el suelo.', duracion: 6, tipo: 'preparacion' },
  { instruccion: 'Relaje los hombros y respire con normalidad.', duracion: 5, tipo: 'preparacion' },
  { instruccion: '🛑 Deténgase si siente fatiga o mareo.', duracion: 5, tipo: 'alerta' },

  // Elevación frontal (2 reps)
  { instruccion: '💪 Eleve los brazos al frente. INHALE.', duracion: 4, tipo: 'activo' },
  { instruccion: '💪 Baje lentamente. EXHALE.', duracion: 4, tipo: 'activo' },
  { instruccion: '💪 Repita. Suba... INHALE...', duracion: 4, tipo: 'activo' },
  { instruccion: '💪 Baje... EXHALE...', duracion: 4, tipo: 'activo' },

  { instruccion: '✨ Descanse.', duracion: 12, tipo: 'descanso' },

  // Elevación lateral (2 reps)
  { instruccion: '💪 Eleve brazos a los lados. INHALE.', duracion: 4, tipo: 'activo' },
  { instruccion: '💪 Baje lentamente. EXHALE.', duracion: 4, tipo: 'activo' },
  { instruccion: '💪 Repita. Suba... INHALE...', duracion: 4, tipo: 'activo' },
  { instruccion: '💪 Baje... EXHALE...', duracion: 4, tipo: 'activo' },

  { instruccion: '✨ Descanse.', duracion: 12, tipo: 'descanso' },

  // Hombros
  { instruccion: '💪 Haga círculos suaves con los hombros hacia adelante.', duracion: 8, tipo: 'activo' },
  { instruccion: '💪 Ahora hacia atrás.', duracion: 8, tipo: 'activo' },

  { instruccion: '✅ Muy bien. Ejercicio completado.', duracion: 6, tipo: 'descanso' },
];

export default function EjercicioPage() {
  const [fase, setFase] = useState<Fase>('menu');
  const [intensidad, setIntensidad] = useState<'normal' | 'reducida' | 'reposo'>('normal');
  const [intervalo, setIntervalo] = useState<Intervalo>('caminar');
  const [repeticionActual, setRepeticionActual] = useState(1);
  const [segundos, setSegundos] = useState(0);
  const [completado, setCompletado] = useState(false);
  const [config, setConfig] = useState<ConfigCaminata>(CONFIG_NORMAL);

  // Estado ejercicios guiados (sentadillas / talones / brazos)
  const [pasosActivos, setPasosActivos] = useState<PasoEjercicio[]>([]);
  const [pasoActual, setPasoActual] = useState(0);
  const [enCurso, setEnCurso] = useState(false);
  const [completedExercise, setCompletedExercise] = useState<string | null>(null);

  // Registro
  const [duracion, setDuracion] = useState(0);
  const [spo2Min, setSpo2Min] = useState(95);
  const [fatiga, setFatiga] = useState(3);
  const [guardado, setGuardado] = useState(false);
  const [alerta, setAlerta] = useState<string | null>(null);

  // Wake Lock — evitar que la pantalla se apague durante la actividad
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const acquireWakeLock = async () => {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    try {
      wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
    } catch (_) { /* silencioso si el navegador lo deniega */ }
  };

  const releaseWakeLock = () => {
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
  };

  // Calcular intensidad recomendada al cargar
  useEffect(() => {
    calcularIntensidadRecomendada().then((rec) => {
      setIntensidad(rec);
      if (rec === 'reducida') setConfig(CONFIG_REDUCIDA);
    });
  }, []);

  // ── Iniciar ejercicio guiado ────────────────────────────────────────────
  const iniciarEjercicioGuiado = (tipo: 'sentadillas' | 'talones' | 'brazos') => {
    const pasos = tipo === 'sentadillas' ? EJERCICIO_SENTADILLAS
      : tipo === 'talones' ? EJERCICIO_TALONES
      : EJERCICIO_BRAZOS;
    setPasosActivos(pasos);
    setPasoActual(0);
    setSegundos(pasos[0].duracion);
    setCompletado(false);
    setEnCurso(false);
    setDuracion(0);
    setFase(tipo);
  };

  // Timer del ejercicio guiado
  useEffect(() => {
    const esGuiado = fase === 'sentadillas' || fase === 'talones' || fase === 'brazos';
    if (!esGuiado || completado || !enCurso) return;

    const timer = setInterval(() => {
      setDuracion((d) => d + 1);
      setSegundos((prev) => {
        if (prev <= 1) {
          const siguiente = pasoActual + 1;
          if (siguiente >= pasosActivos.length) {
            // Marcar ejercicio completado y abrir pantalla de registro
            const ejercicioName = fase === 'sentadillas' ? 'Sentadillas' : fase === 'talones' ? 'Elevación de talones' : 'Ejercicio de brazos';
            setCompletedExercise(ejercicioName);
            setCompletado(true);
            setEnCurso(false);
            releaseWakeLock();
            setFase('registro');
            return 0;
          }
          setPasoActual(siguiente);
          return pasosActivos[siguiente].duracion;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fase, pasoActual, pasosActivos, completado, enCurso]);

  const iniciarCaminata = () => {
    const cfg = intensidad === 'reducida' ? CONFIG_REDUCIDA : CONFIG_NORMAL;
    setConfig(cfg);
    setIntervalo('caminar');
    setRepeticionActual(1);
    setSegundos(cfg.tiempoCaminar);
    setCompletado(false);
    setDuracion(0);
    setFase('caminata');
    acquireWakeLock();
    // Intentar desbloquear audio tras interacción del usuario
    try {
      ensureAudioUnlocked();
    } catch (e) {
      // noop
    }
  };

  // Alertas y sonidos al cambiar de intervalo (ejercicio <-> descanso)
  const prevIntervaloRef = useRef<Intervalo | null>(null);

  useEffect(() => {
    if (fase !== 'caminata' || completado) return;

    const prev = prevIntervaloRef.current as Intervalo | null;
    // ignorar la primera asignación
    if (prev === null) {
      prevIntervaloRef.current = intervalo;
      return;
    }

    if (prev !== intervalo) {
      // Cuando cambia el intervalo, avisar al usuario (solo sonido)
      if (intervalo === 'caminar') {
        // Ha terminado el descanso — empieza ejercicio
        playStartSound();
      } else {
        // Ha terminado el ejercicio — empieza descanso
        playRestSound();
      }
      prevIntervaloRef.current = intervalo;
    }
  }, [intervalo, fase, completado]);

  useEffect(() => {
    if (fase !== 'caminata' || completado) return;

    const timer = setInterval(() => {
      setDuracion((d) => d + 1);
      setSegundos((prev) => {
        if (prev <= 1) {
          if (intervalo === 'caminar') {
            setIntervalo('descanso');
            return config.tiempoDescanso;
          } else {
            const sigRep = repeticionActual + 1;
            if (sigRep > config.repeticiones) {
              // Caminata completada: abrir registro inmediatamente
              setCompletedExercise('Caminata por intervalos');
              setCompletado(true);
              releaseWakeLock();
              setFase('registro');
              return 0;
            }
            setRepeticionActual(sigRep);
            setIntervalo('caminar');
            return config.tiempoCaminar;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fase, intervalo, repeticionActual, config, completado]);

  const formatearTiempo = (seg: number) => {
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const guardarRegistroDatos = useCallback(async (exerciseName?: string) => {
    const alertas: string[] = [];

    const resSpO2 = evaluarSpO2(spo2Min);
    if (resSpO2) {
      await procesarAlerta(resSpO2);
      alertas.push(resSpO2.mensaje);
    }

    const resFatiga = evaluarFatiga(fatiga);
    if (resFatiga) {
      await procesarAlerta(resFatiga);
      alertas.push(resFatiga.mensaje);
    }

    if (alertas.length > 0) {
      setAlerta(alertas.join(' | '));
    }

    await guardarRegistro({
      fecha: fechaHoy(),
      tipo: 'ejercicio',
      datos: {
        duracion: Math.round(duracion / 60),
        spo2Min,
        fatiga,
        intensidad,
        ejercicio: exerciseName || completedExercise || null,
      },
      timestamp: Date.now(),
    });
    try {
      const label = exerciseName || completedExercise || 'ejercicio';
      await historyLib.addHistory(`ejercicio: ${label} registrado`, { duracion: Math.round(duracion / 60), spo2Min, fatiga, intensidad, ejercicio: label, fecha: fechaHoy() });
    } catch (e) {
      // no bloquear la UI por fallos en historial
      // eslint-disable-next-line no-console
      console.warn('No se pudo guardar historial de ejercicio:', e);
    }
    setGuardado(true);
    // limpiar ejercicio completado
    setCompletedExercise(null);
  }, [spo2Min, fatiga, duracion, intensidad]);

  return (
    <>
      <Header titulo="🚶 Ejercicio" mostrarVolver />
      <div className="px-4 pb-8">

        {/* ────────── MENÚ PRINCIPAL ────────── */}
        {fase === 'menu' && (
          <div className="space-y-5">

            <div className="mt-2 mb-1 text-center">
              <p className="text-gray-500 text-base leading-relaxed">
                Ejercicios seguros y guiados para mantenerse activa.
              </p>
            </div>

            {/* Caminata */}
            <button
              className="exercise-card w-full"
              onClick={() => {
                if (intensidad === 'reposo') return;
                iniciarCaminata();
              }}
            >
              <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)' }}
                className="p-6 flex items-center gap-5">
                <span className="text-6xl select-none">🚶</span>
                <div className="flex-1 text-left">
                  <p className="text-white font-bold text-xl leading-tight">Caminata por intervalos</p>
                  <p className="text-blue-100 text-sm mt-1">
                    Camine suave con descansos · {config.repeticiones} rondas
                  </p>
                  {intensidad === 'reposo' && (
                    <div className="mt-2 bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full inline-block">
                      No recomendado hoy
                    </div>
                  )}
                  {intensidad === 'reducida' && (
                    <div className="mt-2 bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full inline-block">
                      Intensidad reducida
                    </div>
                  )}
                </div>
                <span className="text-white text-2xl select-none">▶</span>
              </div>
            </button>

            {/* Sentadillas */}
            <button
              className="exercise-card w-full"
              onClick={() => iniciarEjercicioGuiado('sentadillas')}
            >
              <div style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' }}
                className="p-6 flex items-center gap-5">
                <span className="text-6xl select-none">🦵</span>
                <div className="flex-1 text-left">
                  <p className="text-white font-bold text-xl leading-tight">Sentadillas</p>
                  <p className="text-purple-900 text-sm mt-1">
                    Fortalece piernas y caderas · 2 series de 5 rep
                  </p>
                  <div className="mt-3 flex gap-2">
                    <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      2x5 repeticiones
                    </span>
                    <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Apoyo silla opcional
                    </span>
                  </div>
                </div>
                <span className="text-white text-2xl select-none">▶</span>
              </div>
            </button>

            {/* Elevación de talones */}
            <button
              className="exercise-card w-full"
              onClick={() => iniciarEjercicioGuiado('talones')}
            >
              <div style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}
                className="p-6 flex items-center gap-5">
                <span className="text-6xl select-none">🦶</span>
                <div className="flex-1 text-left">
                  <p className="text-white font-bold text-xl leading-tight">Elevación de talones</p>
                  <p className="text-emerald-100 text-sm mt-1">
                    Mejora circulación y equilibrio · 2 series de 5 rep
                  </p>
                  <div className="mt-3 flex gap-2">
                    <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      2x5 repeticiones
                    </span>
                    <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Apoyo recomendado
                    </span>
                  </div>
                </div>
                <span className="text-white text-2xl select-none">▶</span>
              </div>
            </button>

            {/* Ejercicio de brazos */}
            <button
              className="exercise-card w-full"
              onClick={() => iniciarEjercicioGuiado('brazos')}
            >
              <div style={{ background: 'linear-gradient(135deg, #f97316 0%, #d97706 100%)' }}
                className="p-6 flex items-center gap-5">
                <span className="text-6xl select-none">💪</span>
                <div className="flex-1 text-left">
                  <p className="text-white font-bold text-xl leading-tight">Ejercicio de brazos</p>
                  <p className="text-amber-100 text-sm mt-1">
                    Movilidad de hombros y fuerza ligera · 3 bloques
                  </p>
                  <div className="mt-3 flex gap-2">
                    <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Sentada / de pie
                    </span>
                    <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Sin pesas (opcional botellas)
                    </span>
                  </div>
                </div>
                <span className="text-white text-2xl select-none">▶</span>
              </div>
            </button>

            {/* Consejo */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
              <span className="text-2xl">💡</span>
              <p className="text-amber-800 text-sm leading-relaxed">
                Si siente que el oxígeno baja de 88%, tiene mareo o falta de aire, deténgase y descanse.
              </p>
            </div>

            {/* Botón registro */}
            <button
              className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-4 flex items-center justify-center gap-3
                         text-gray-500 font-semibold text-base hover:border-gray-400 hover:text-gray-700
                         active:scale-95 transition-all"
              onClick={() => setFase('registro')}
            >
              <span className="text-xl">📊</span>
              Solo registrar ejercicio
            </button>
          </div>
        )}

        {/* ────────── CAMINATA ────────── */}
        {fase === 'caminata' && !completado && (
          <div className="space-y-4">
            <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-green-500 h-full transition-all"
                style={{ width: `${((repeticionActual - 1 + (intervalo === 'descanso' ? 0.5 : 0)) / config.repeticiones) * 100}%` }}
              />
            </div>
            <p className="text-sm text-center text-gray-500">
              Ronda {repeticionActual} de {config.repeticiones}
            </p>

            <div className={`rounded-2xl p-8 text-center border-2 ${
              intervalo === 'caminar'
                ? 'bg-green-50 border-green-400'
                : 'bg-blue-50 border-blue-400'
            }`}>
              <p className="text-4xl mb-2">
                {intervalo === 'caminar' ? '🚶' : '🪑'}
              </p>
              <p className="text-2xl font-bold text-gray-800">
                {intervalo === 'caminar' ? 'CAMINE SUAVE' : 'DESCANSE'}
              </p>
              <p className="text-6xl font-bold mt-4 text-gray-900">
                {formatearTiempo(segundos)}
              </p>
              <p className="text-gray-500 mt-2">
                Tiempo total: {formatearTiempo(duracion)}
              </p>
            </div>

            <AlertBanner
              tipo="info"
              mensaje="Si su oxígeno baja de 88% o siente mucha fatiga, DETÉNGASE inmediatamente"
            />

            <Button
              fullWidth
              variant="danger"
              onClick={() => {
                releaseWakeLock();
                setCompletado(true);
              }}
            >
              ⏹️ Detener
            </Button>
          </div>
        )}

        {fase === 'caminata' && completado && (
          <div className="space-y-4 text-center">
            <Card icon="🎉" title="¡Caminata completada!" color="green">
              <p className="text-lg">Tiempo total: {formatearTiempo(duracion)}</p>
            </Card>
            <Button fullWidth onClick={() => { releaseWakeLock(); setFase('registro'); }}>
              📊 Registrar resultados
            </Button>
            <Button fullWidth variant="ghost" onClick={() => { releaseWakeLock(); setFase('menu'); }}>
              Volver
            </Button>
          </div>
        )}

        {/* ────────── EJERCICIOS GUIADOS (sentadillas / talones / brazos) ────────── */}
        {(fase === 'sentadillas' || fase === 'talones' || fase === 'brazos') && (() => {
          const paso = pasosActivos[pasoActual];
          if (!paso) return null;
          const progreso = pasosActivos.length > 0 ? ((pasoActual + 1) / pasosActivos.length) * 100 : 0;
          const colorBorde = paso.tipo === 'activo'
            ? 'bg-purple-50 border-purple-400'
            : paso.tipo === 'descanso'
            ? 'bg-blue-50 border-blue-400'
            : 'bg-gray-50 border-gray-300';
          const colorBarra = paso.tipo === 'activo' ? '#8b5cf6'
            : paso.tipo === 'descanso' ? '#3b82f6'
            : '#94a3b8';

          return completado ? (
            <div className="space-y-4 text-center">
              <Card icon="🎉" title="¡Ejercicio completado!" color="green">
                <p className="text-lg">Tiempo total: {formatearTiempo(duracion)}</p>
              </Card>
              <Button fullWidth onClick={() => { setFase('registro'); }}>
                📊 Registrar resultados
              </Button>
              <Button fullWidth variant="ghost" onClick={() => { setFase('menu'); setCompletado(false); }}>
                Volver
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Barra de progreso */}
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1 px-0.5">
                  <span>Paso {pasoActual + 1} de {pasosActivos.length}</span>
                  <span>{Math.round(progreso)}%</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-in-out"
                    style={{ width: `${progreso}%`, background: colorBarra }}
                  />
                </div>
              </div>

              {/* Panel de instrucción */}
              {!enCurso ? (
                <>
                  <div className={`rounded-2xl p-6 text-center border-2 ${colorBorde}`}>
                    <p className="text-xl font-bold text-gray-800 leading-relaxed">{paso.instruccion}</p>
                  </div>
                  <Button
                    fullWidth
                    onClick={() => {
                      setPasoActual(0);
                      setSegundos(pasosActivos[0].duracion);
                      setEnCurso(true);
                      acquireWakeLock();
                      try { ensureAudioUnlocked(); } catch {}
                    }}
                  >
                    ▶️ Iniciar
                  </Button>
                  <Button fullWidth variant="ghost" onClick={() => { setFase('menu'); setCompletado(false); }}>
                    ← Volver
                  </Button>
                </>
              ) : (
                <>
                  <div className={`rounded-2xl p-6 text-center border-2 ${colorBorde}`}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-3 text-gray-500">
                      {paso.tipo === 'activo' ? 'EJERCICIO' : paso.tipo === 'descanso' ? 'DESCANSO' : 'PREPARACIÓN'}
                    </p>
                    <p className="text-xl font-bold text-gray-800 leading-relaxed">{paso.instruccion}</p>
                    <p className="text-6xl font-bold mt-4 text-gray-900">{segundos}</p>
                    <p className="text-sm text-gray-400 mt-1">segundos</p>
                  </div>

                  <AlertBanner
                    tipo="info"
                    mensaje="Si siente mareo o falta de aire, deténgase y descanse"
                  />

                  <Button
                    fullWidth
                    variant="danger"
                    onClick={() => {
                      releaseWakeLock();
                      setEnCurso(false);
                      setCompletado(true);
                    }}
                  >
                    ⏹️ Detener
                  </Button>
                </>
              )}
            </div>
          );
        })()}

        {/* ────────── REGISTRO ────────── */}
        {fase === 'registro' && (
          <div className="space-y-4">
            <Card icon="📊" title="Registro de ejercicio" color="blue">
              <p className="text-gray-600">
                Registre cómo le fue con el ejercicio de hoy.
              </p>
            </Card>

            {completedExercise && (
              <div className="bg-white rounded-lg p-3 border text-sm text-gray-700">
                <strong>Ejercicio completado:</strong> {completedExercise}
              </div>
            )}

            {alerta && <AlertBanner tipo="critica" mensaje={alerta} onClose={() => setAlerta(null)} />}

            <NumberInput
              label="Saturación mínima durante ejercicio (SpO2)"
              value={spo2Min}
              onChange={setSpo2Min}
              min={70}
              max={100}
              unit="%"
            />

            <SliderInput
              label="Nivel de fatiga"
              value={fatiga}
              onChange={setFatiga}
              min={1}
              max={10}
            />
            <p className="text-sm text-gray-500 -mt-2">
              1 = Sin fatiga · 10 = Extremadamente cansado
            </p>

            {guardado ? (
              <AlertBanner tipo="exito" mensaje="Registro guardado correctamente" />
            ) : (
              <Button fullWidth onClick={() => guardarRegistroDatos(completedExercise || undefined)}>
                💾 Guardar Registro
              </Button>
            )}

            <Button fullWidth variant="ghost" onClick={() => { setFase('menu'); setGuardado(false); setAlerta(null); }}>
              ← Volver
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
