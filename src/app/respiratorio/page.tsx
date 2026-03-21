'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Header from '@/components/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import NumberInput from '@/components/ui/NumberInput';
import SliderInput from '@/components/ui/SliderInput';
import AlertBanner from '@/components/ui/AlertBanner';
import { guardarRegistro, fechaHoy } from '@/lib/db';
import { evaluarSpO2, procesarAlerta } from '@/lib/rules';

type Fase = 'menu' | 'diafragmatica' | 'labios' | 'registro';

interface PasoEjercicio {
  instruccion: string;
  duracion: number; // segundos
  tipo: 'inhalar' | 'exhalar' | 'mantener' | 'descanso';
}

const EJERCICIO_DIAFRAGMATICO: PasoEjercicio[] = [
  { instruccion: 'Siéntese cómodamente con la espalda recta', duracion: 5, tipo: 'descanso' },
  { instruccion: 'Ponga una mano en el pecho y otra en el abdomen', duracion: 5, tipo: 'descanso' },
  { instruccion: '🫁 INHALE por la nariz lentamente... llene el abdomen', duracion: 4, tipo: 'inhalar' },
  { instruccion: '⏸️ Mantenga el aire...', duracion: 2, tipo: 'mantener' },
  { instruccion: '💨 EXHALE por la boca lentamente... vacíe el abdomen', duracion: 6, tipo: 'exhalar' },
  { instruccion: '🫁 INHALE por la nariz lentamente...', duracion: 4, tipo: 'inhalar' },
  { instruccion: '⏸️ Mantenga...', duracion: 2, tipo: 'mantener' },
  { instruccion: '💨 EXHALE lentamente por la boca...', duracion: 6, tipo: 'exhalar' },
  { instruccion: '🫁 INHALE... sienta cómo sube el abdomen', duracion: 4, tipo: 'inhalar' },
  { instruccion: '⏸️ Mantenga...', duracion: 2, tipo: 'mantener' },
  { instruccion: '💨 EXHALE... sienta cómo baja el abdomen', duracion: 6, tipo: 'exhalar' },
  { instruccion: '🫁 INHALE profundamente...', duracion: 4, tipo: 'inhalar' },
  { instruccion: '⏸️ Mantenga...', duracion: 2, tipo: 'mantener' },
  { instruccion: '💨 EXHALE completamente...', duracion: 6, tipo: 'exhalar' },
  { instruccion: '🫁 INHALE... está haciéndolo muy bien', duracion: 4, tipo: 'inhalar' },
  { instruccion: '⏸️ Mantenga...', duracion: 2, tipo: 'mantener' },
  { instruccion: '💨 EXHALE lentamente...', duracion: 6, tipo: 'exhalar' },
  { instruccion: '✅ ¡Excelente! Ha completado el ejercicio', duracion: 5, tipo: 'descanso' },
];

const EJERCICIO_LABIOS: PasoEjercicio[] = [
  { instruccion: 'Siéntese relajado/a', duracion: 5, tipo: 'descanso' },
  { instruccion: 'Cierre la boca. Relaje los hombros. 💨 Frunza los labios como si fuera a silbar', duracion: 5, tipo: 'descanso' },
  { instruccion: '🫁 INHALE por la nariz contando hasta 2', duracion: 3, tipo: 'inhalar' },
  { instruccion: '💨 EXHALE LENTO por los labios fruncidos (cuente hasta 4)', duracion: 5, tipo: 'exhalar' },
  { instruccion: '🫁 INHALE por la nariz... 1, 2', duracion: 3, tipo: 'inhalar' },
  { instruccion: '💨 EXHALE por labios fruncidos... 1, 2, 3, 4', duracion: 5, tipo: 'exhalar' },
  { instruccion: '🫁 INHALE despacio por la nariz...', duracion: 3, tipo: 'inhalar' },
  { instruccion: '💨 EXHALE por labios fruncidos, el doble de lento...', duracion: 5, tipo: 'exhalar' },
  { instruccion: '🫁 INHALE... relaje el cuerpo', duracion: 3, tipo: 'inhalar' },
  { instruccion: '💨 EXHALE suavemente... como apagar una vela lejana', duracion: 5, tipo: 'exhalar' },
  { instruccion: '🫁 INHALE... llene bien los pulmones', duracion: 3, tipo: 'inhalar' },
  { instruccion: '💨 EXHALE largo y controlado...', duracion: 5, tipo: 'exhalar' },
  { instruccion: '✅ ¡Muy bien! Ejercicio completado', duracion: 5, tipo: 'descanso' },
];

const coloresFase: Record<string, string> = {
  inhalar: 'bg-blue-100 border-blue-400',
  exhalar: 'bg-green-100 border-green-400',
  mantener: 'bg-yellow-100 border-yellow-400',
  descanso: 'bg-gray-100 border-gray-300',
};

export default function RespiratorioPage() {
  const [fase, setFase] = useState<Fase>('menu');
  const [pasoActual, setPasoActual] = useState(0);
  const [segundos, setSegundos] = useState(0);
  const [ejercicioActivo, setEjercicioActivo] = useState<PasoEjercicio[]>([]);
  const [completado, setCompletado] = useState(false);

  // Registro
  const [spo2, setSpo2] = useState(95);
  const [disnea, setDisnea] = useState(3);
  const [guardado, setGuardado] = useState(false);
  const [alerta, setAlerta] = useState<string | null>(null);

  // Audio (sintetizado) — no requiere archivos externos
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioInitializedRef = useRef(false);

  const initAudio = async () => {
    if (audioInitializedRef.current) return;
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    audioCtxRef.current = new AC();
    try {
      if (audioCtxRef.current) {
        await audioCtxRef.current.resume();
      }
    } catch (e) {
      // ignore
    }
    audioInitializedRef.current = true;
  };

  const playTick = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.value = 1000;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.25, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(now);
    o.stop(now + 0.13);
  };

  const playInhale = (dur = 0.8) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(350, now);
    o.frequency.linearRampToValueAtTime(900, now + dur);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.12, now + dur * 0.6);
    g.gain.linearRampToValueAtTime(0.02, now + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(now);
    o.stop(now + dur + 0.05);
  };

  const playExhale = (dur = 0.8) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(900, now);
    o.frequency.linearRampToValueAtTime(350, now + dur);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.12, now + dur * 0.4);
    g.gain.linearRampToValueAtTime(0.01, now + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(now);
    o.stop(now + dur + 0.05);
  };

  const iniciarEjercicio = (tipo: 'diafragmatica' | 'labios') => {
    const pasos = tipo === 'diafragmatica' ? EJERCICIO_DIAFRAGMATICO : EJERCICIO_LABIOS;
    setEjercicioActivo(pasos);
    setPasoActual(0);
    setSegundos(pasos[0].duracion);
    setCompletado(false);
    setFase(tipo);
    // Inicializar audio en el gesto de inicio
    initAudio();
  };

  useEffect(() => {
    if (fase === 'menu' || fase === 'registro' || completado) return;

    const timer = setInterval(() => {
      // sonido por segundo
      playTick();
      setSegundos((prev) => {
        if (prev <= 1) {
          // Avanzar al siguiente paso
          const siguiente = pasoActual + 1;
          if (siguiente >= ejercicioActivo.length) {
            setCompletado(true);
            return 0;
          }
          setPasoActual(siguiente);
          return ejercicioActivo[siguiente].duracion;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fase, pasoActual, ejercicioActivo, completado]);

  const paso = ejercicioActivo[pasoActual];

  // Reproducir sonido según tipo de paso cuando cambia
  useEffect(() => {
    if (!paso) return;
    if (!audioInitializedRef.current) return; // esperar inicialización
    if (paso.tipo === 'inhalar') {
      playInhale(Math.min(paso.duracion, 3));
    } else if (paso.tipo === 'exhalar') {
      playExhale(Math.min(paso.duracion, 3));
    }
  }, [paso?.tipo, paso?.duracion]);

  const guardarRegistroDatos = useCallback(async () => {
    const resultado = evaluarSpO2(spo2);
    if (resultado) {
      await procesarAlerta(resultado);
      setAlerta(resultado.mensaje);
    }

    await guardarRegistro({
      fecha: fechaHoy(),
      tipo: 'respiratorio',
      datos: { spo2, disnea },
      timestamp: Date.now(),
    });
    setGuardado(true);
  }, [spo2, disnea]);

  return (
    <>
      <Header titulo="🫁 Respiratorio" mostrarVolver />
      <div className="p-4">
        {fase === 'menu' && (
          <div className="space-y-4">
            <Card icon="💡" title="Ejercicios respiratorios" color="green">
              <p className="text-gray-600 text-lg mb-4">
                Estos ejercicios fortalecen sus pulmones de forma segura. Duran entre 5 y 8 minutos.
              </p>
            </Card>

            <Button fullWidth onClick={() => iniciarEjercicio('diafragmatica')}>
              🫁 Respiración Diafragmática
            </Button>
            <p className="text-gray-500 text-center">Fortalece el diafragma · ~5 min</p>

            <Button fullWidth variant="secondary" onClick={() => iniciarEjercicio('labios')}>
              💨 Labios Fruncidos
            </Button>
            <p className="text-gray-500 text-center">Mejora la exhalación · ~4 min</p>

            <div className="mt-6">
              <Button fullWidth variant="ghost" onClick={() => setFase('registro')}>
                📊 Registrar SpO2 y Disnea
              </Button>
            </div>
          </div>
        )}

        {(fase === 'diafragmatica' || fase === 'labios') && !completado && paso && (
          <div className="space-y-4">
            {/* Progreso */}
            <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-green-500 h-full transition-all duration-500"
                style={{ width: `${((pasoActual + 1) / ejercicioActivo.length) * 100}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 text-center">
              Paso {pasoActual + 1} de {ejercicioActivo.length}
            </p>

            {/* Instrucción principal */}
            <div className={`${coloresFase[paso.tipo]} border-2 rounded-2xl p-8 text-center`}>
              <p className="text-2xl font-bold text-gray-800 leading-relaxed">
                {paso.instruccion}
              </p>
            </div>

            {/* Círculo de respiración */}
            <div className="flex justify-center py-6">
              <div
                className={`
                  w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-lg
                  ${paso.tipo === 'inhalar' ? 'bg-blue-500 animate-breathe-in' : ''}
                  ${paso.tipo === 'exhalar' ? 'bg-green-500 animate-breathe-out' : ''}
                  ${paso.tipo === 'mantener' ? 'bg-yellow-500' : ''}
                  ${paso.tipo === 'descanso' ? 'bg-gray-400' : ''}
                `}
              >
                {segundos}
              </div>
            </div>

            <Button fullWidth variant="danger" onClick={() => { setFase('menu'); setCompletado(false); }}>
              Detener
            </Button>
          </div>
        )}

        {completado && (
          <div className="space-y-4 text-center">
            <Card icon="🎉" title="¡Ejercicio completado!" color="green">
              <p className="text-lg text-gray-700">
                Ha completado su ejercicio respiratorio. ¡Excelente trabajo!
              </p>
            </Card>
            <Button fullWidth onClick={() => setFase('registro')}>
              📊 Registrar cómo se siente
            </Button>
            <Button
              fullWidth
              variant="ghost"
              onClick={() => {
                setFase('menu');
                setCompletado(false);
                setGuardado(false);
                setAlerta(null);
              }}
            >
              Volver al menú
            </Button>
          </div>
        )}

        {fase === 'registro' && (
          <div className="space-y-4">
            <Card icon="📊" title="Registro respiratorio" color="blue">
              <p className="text-gray-600 mb-4">
                Ingrese su saturación de oxígeno y cómo siente su respiración.
              </p>
            </Card>

            {alerta && <AlertBanner tipo="critica" mensaje={alerta} onClose={() => setAlerta(null)} />}

            <NumberInput
              label="Saturación de oxígeno (SpO2)"
              value={spo2}
              onChange={setSpo2}
              min={70}
              max={100}
              unit="%"
            />

            <SliderInput
              label="Dificultad para respirar (disnea)"
              value={disnea}
              onChange={setDisnea}
              min={1}
              max={10}
            />
            <p className="text-sm text-gray-500 -mt-2 mb-4">
              1 = Sin dificultad · 10 = Muy difícil respirar
            </p>

            {guardado ? (
              <AlertBanner tipo="exito" mensaje="Registro guardado correctamente" />
            ) : (
              <Button fullWidth onClick={guardarRegistroDatos}>
                💾 Guardar Registro
              </Button>
            )}

            <Button
              fullWidth
              variant="ghost"
              onClick={() => {
                setFase('menu');
                setGuardado(false);
                setAlerta(null);
                setCompletado(false);
              }}
            >
              ← Volver
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
