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

type Fase = 'menu' | 'caminata' | 'registro';
type Intervalo = 'caminar' | 'descanso';

interface ConfigCaminata {
  tiempoCaminar: number; // segundos
  tiempoDescanso: number;
  repeticiones: number;
}

const CONFIG_NORMAL: ConfigCaminata = { tiempoCaminar: 120, tiempoDescanso: 120, repeticiones: 4 };
const CONFIG_REDUCIDA: ConfigCaminata = { tiempoCaminar: 90, tiempoDescanso: 150, repeticiones: 3 };

export default function EjercicioPage() {
  const [fase, setFase] = useState<Fase>('menu');
  const [intensidad, setIntensidad] = useState<'normal' | 'reducida' | 'reposo'>('normal');
  const [intervalo, setIntervalo] = useState<Intervalo>('caminar');
  const [repeticionActual, setRepeticionActual] = useState(1);
  const [segundos, setSegundos] = useState(0);
  const [completado, setCompletado] = useState(false);
  const [config, setConfig] = useState<ConfigCaminata>(CONFIG_NORMAL);

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
              setCompletado(true);
              releaseWakeLock();
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

  const guardarRegistroDatos = useCallback(async () => {
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
      },
      timestamp: Date.now(),
    });
    try {
      await historyLib.addHistory('ejercicio registrado', { duracion: Math.round(duracion / 60), spo2Min, fatiga, intensidad, fecha: fechaHoy() });
    } catch (e) {
      // no bloquear la UI por fallos en historial
      // eslint-disable-next-line no-console
      console.warn('No se pudo guardar historial de ejercicio:', e);
    }
    setGuardado(true);
  }, [spo2Min, fatiga, duracion, intensidad]);

  return (
    <>
      <Header titulo="🚶 Ejercicio" mostrarVolver />
      <div className="p-4">
        {fase === 'menu' && (
          <div className="space-y-4">
            <Card icon="🚶" title="Caminata por intervalos" color="blue">
              <p className="text-gray-600 text-lg mb-2">
                Camine suave por intervalos con descansos. Seguro y controlado.
              </p>
              {intensidad === 'reposo' && (
                <AlertBanner
                  tipo="advertencia"
                  mensaje="Su cuerpo necesita descanso hoy. No se recomienda ejercicio."
                />
              )}
              {intensidad === 'reducida' && (
                <AlertBanner
                  tipo="info"
                  mensaje="Intensidad reducida automáticamente por fatiga reciente."
                />
              )}
            </Card>

            {intensidad !== 'reposo' && (
              <>
                <Card color="white">
                  <div className="text-center space-y-2">
                    <p className="text-lg font-semibold">Plan de hoy:</p>
                    <p className="text-gray-600">
                      {config.repeticiones} rondas de:
                    </p>
                    <div className="flex gap-4 justify-center">
                      <div className="bg-green-100 rounded-xl px-4 py-2">
                        <span className="text-2xl font-bold text-green-700">{config.tiempoCaminar / 60}</span>
                        <span className="text-green-600 ml-1">min caminar</span>
                      </div>
                      <div className="bg-blue-100 rounded-xl px-4 py-2">
                        <span className="text-2xl font-bold text-blue-700">{config.tiempoDescanso / 60}</span>
                        <span className="text-blue-600 ml-1">min descanso</span>
                      </div>
                    </div>
                  </div>
                </Card>

                <Button fullWidth onClick={iniciarCaminata}>
                  ▶️ Iniciar Caminata
                </Button>
              </>
            )}

            <Button fullWidth variant="ghost" onClick={() => setFase('registro')}>
              📊 Solo registrar ejercicio
            </Button>
          </div>
        )}

        {fase === 'caminata' && !completado && (
          <div className="space-y-4">
            {/* Progreso */}
            <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-green-500 h-full transition-all"
                style={{ width: `${((repeticionActual - 1 + (intervalo === 'descanso' ? 0.5 : 0)) / config.repeticiones) * 100}%` }}
              />
            </div>
            <p className="text-sm text-center text-gray-500">
              Ronda {repeticionActual} de {config.repeticiones}
            </p>

            {/* Estado actual */}
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

        {fase === 'registro' && (
          <div className="space-y-4">
            <Card icon="📊" title="Registro de ejercicio" color="blue">
              <p className="text-gray-600">
                Registre cómo le fue con el ejercicio de hoy.
              </p>
            </Card>

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
              <Button fullWidth onClick={guardarRegistroDatos}>
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
