'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Header from '@/components/Header';
import Button from '@/components/ui/Button';
import NumberInput from '@/components/ui/NumberInput';
import SliderInput from '@/components/ui/SliderInput';
import AlertBanner from '@/components/ui/AlertBanner';
import { guardarRegistro, fechaHoy } from '@/lib/db';
import historyLib from '@/lib/history';
import { evaluarSpO2, procesarAlerta } from '@/lib/rules';

type Fase = 'menu' | 'diafragmatica' | 'labios' | 'huffing' | 'registro';

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

const EJERCICIO_HUFFING: PasoEjercicio[] = [
  { instruccion: 'Siéntese derecha, con los pies bien apoyados y el oxígeno puesto', duracion: 6, tipo: 'descanso' },
  // Ciclo 1
  { instruccion: '🫁 INHALE profundo y tranquilo por la nariz... ', duracion: 4, tipo: 'inhalar' },
  { instruccion: '⏸️ Mantenga el aire... ', duracion: 3, tipo: 'mantener' },
  { instruccion: '💨 HUFF 1 — Boca en círculo: "Jaaaaff', duracion: 3, tipo: 'exhalar' },
  { instruccion: '💨 HUFF 2 — Repita: "Jaaaaff""', duracion: 3, tipo: 'exhalar' },
  { instruccion: '✨ Descanse... respire con normalidad unos segundos', duracion: 6, tipo: 'descanso' },
  // Ciclo 2
  { instruccion: '🫁 INHALE profundo y tranquilo por la nariz...', duracion: 4, tipo: 'inhalar' },
  { instruccion: '⏸️ Mantenga el aire 2-3 segundos...', duracion: 3, tipo: 'mantener' },
  { instruccion: '💨 HUFF 1 — Boca en círculo: "Jaaaaff"', duracion: 3, tipo: 'exhalar' },
  { instruccion: '💨 HUFF 2 — Repita: "Jaaaaff"', duracion: 3, tipo: 'exhalar' },
  { instruccion: '✨ Descanse... respire con calma', duracion: 6, tipo: 'descanso' },
  // Ciclo 3
  { instruccion: '🫁 INHALE profundo y tranquilo... último ciclo', duracion: 4, tipo: 'inhalar' },
  { instruccion: '⏸️ Mantenga el aire...', duracion: 3, tipo: 'mantener' },
  { instruccion: '💨 HUFF 1 — Boca en círculo: "Jaaaaff"', duracion: 3, tipo: 'exhalar' },
  { instruccion: '💨 HUFF 2 — Último huff: "Jaaaaff"', duracion: 3, tipo: 'exhalar' },
  { instruccion: '✅ ¡Excelente! Ha completado la limpieza bronquial', duracion: 5, tipo: 'descanso' },
];

const EJERCICIO_LABIOS: PasoEjercicio[] = [
  { instruccion: 'Siéntese relajada', duracion: 5, tipo: 'descanso' },
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

export default function RespiratorioPage() {
  const [fase, setFase] = useState<Fase>('menu');
  const [pasoActual, setPasoActual] = useState(0);
  const [segundos, setSegundos] = useState(0);
  const [ejercicioActivo, setEjercicioActivo] = useState<PasoEjercicio[]>([]);
  const [completado, setCompletado] = useState(false);
  // indica si la sesión está en ejecución (cronómetro/voz/sonidos activos)
  const [enCurso, setEnCurso] = useState<boolean>(false);

  // Registro
  const [spo2, setSpo2] = useState(95);
  const [disnea, setDisnea] = useState(3);
  const [guardado, setGuardado] = useState(false);
  const [alerta, setAlerta] = useState<string | null>(null);

  // Audio (sintetizado) — no requiere archivos externos
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioInitializedRef = useRef(false);
  // TTS
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

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

  // cargar voces para TTS
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const load = () => { voicesRef.current = window.speechSynthesis.getVoices(); };
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  const speak = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      // eliminar emojis y símbolos gráficos para que no sean pronunciados
      let clean = text.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, '');
      clean = clean.replace(/\s+/g, ' ').replace(/[,]/g, '').trim();
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = 'es-ES';
      u.rate = 0.85;
      u.pitch = 0.9;
      u.volume = 0.9;
      const voices = voicesRef.current || [];
      const best = voices.find(v => v.lang && v.lang.startsWith('es') && /google|sofia|lucia|maria|mónica|monica/i.test(v.name)) || voices.find(v => v.lang && v.lang.startsWith('es')) || voices[0];
      if (best) u.voice = best;
      utterRef.current = u;
      window.speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
  };

  const stopSpeak = () => { try { window.speechSynthesis.cancel(); utterRef.current = null; } catch {} };

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

  const iniciarEjercicio = (tipo: 'diafragmatica' | 'labios' | 'huffing') => {
    const pasos = tipo === 'diafragmatica' ? EJERCICIO_DIAFRAGMATICO
      : tipo === 'labios' ? EJERCICIO_LABIOS
      : EJERCICIO_HUFFING;
    setEjercicioActivo(pasos);
    setPasoActual(0);
    setSegundos(pasos[0].duracion);
    setCompletado(false);
    setFase(tipo);
    // preparar pero no iniciar: el usuario debe pulsar "Iniciar" para arrancar audio/voz
    setEnCurso(false);
  };

  useEffect(() => {
    if (fase === 'menu' || fase === 'registro' || completado || !enCurso) return;

    const timer = setInterval(() => {
      // sonido por segundo
      playTick();
      setSegundos((prev) => {
        if (prev <= 1) {
          // Avanzar al siguiente paso
          const siguiente = pasoActual + 1;
          if (siguiente >= ejercicioActivo.length) {
            setCompletado(true);
            setEnCurso(false);
            return 0;
          }
          setPasoActual(siguiente);
          return ejercicioActivo[siguiente].duracion;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fase, pasoActual, ejercicioActivo, completado, enCurso]);

  const paso = ejercicioActivo[pasoActual];

  // Reproducir sonido según tipo de paso cuando cambia
  useEffect(() => {
    if (!paso) return;
    if (!audioInitializedRef.current || !enCurso) return; // esperar inicialización y que la sesión esté en curso
    if (paso.tipo === 'inhalar') {
      playInhale(Math.min(paso.duracion, 3));
    } else if (paso.tipo === 'exhalar') {
      playExhale(Math.min(paso.duracion, 3));
    } else if (paso.tipo === 'mantener') {
      // suavemente indicar mantenimiento con tick extendido
      playTick();
    }
    // hablar la instrucción de forma relajada
    try { speak(paso.instruccion); } catch (e) { /* noop */ }
  }, [paso?.tipo, paso?.duracion, paso?.instruccion, enCurso]);

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
    try {
      await historyLib.addHistory('respiratorio registrado', { spo2, disnea, fecha: fechaHoy() });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('No se pudo guardar historial respiratorio:', e);
    }
    setGuardado(true);
  }, [spo2, disnea]);

  // al completar la sesión: guardar automáticamente y felicitar con voz
  useEffect(() => {
    if (!completado) return;
    try {
      // tono de felicitación
      try { playInhale(0.3); playExhale(0.6); } catch (e) { /* noop */ }
      speak('Has completado el ejercicio. Muy bien hecho, ¡felicidades!');
    } catch (e) { /* noop */ }
    (async () => { try { await guardarRegistroDatos(); } catch (e) { /* noop */ } })();
  }, [completado, guardarRegistroDatos]);

  /* Colores del círculo por tipo de paso */
  const circuloConfig: Record<string, { bg: string; ring: string; anim: string; label: string }> = {
    inhalar: { bg: 'bg-blue-500', ring: 'bg-blue-300', anim: 'animate-breathe-in', label: 'INHALE' },
    exhalar: { bg: 'bg-emerald-500', ring: 'bg-emerald-300', anim: 'animate-breathe-out', label: 'EXHALE' },
    mantener: { bg: 'bg-amber-400', ring: 'bg-amber-200', anim: 'animate-breathe-hold', label: 'MANTÉN' },
    descanso: { bg: 'bg-slate-400', ring: 'bg-slate-200', anim: '', label: '···' },
  };

  const cfg = paso ? circuloConfig[paso.tipo] : circuloConfig.descanso;
  const progreso = ejercicioActivo.length > 0 ? ((pasoActual + 1) / ejercicioActivo.length) * 100 : 0;

  return (
    <>
      <Header titulo="🫁 Respiratorio" mostrarVolver />

      <div className="px-4 pb-8">

        {/* ────────── MENÚ PRINCIPAL ────────── */}
        {fase === 'menu' && (
          <div className="space-y-5">

            {/* Cabecera */}
            <div className="mt-2 mb-1 text-center">
              <p className="text-gray-500 text-base leading-relaxed">
                Ejercicios para fortalecer sus pulmones de forma segura.
              </p>
            </div>

            {/* Tarjeta Diafragmática */}
            <button
              className="exercise-card w-full"
              onClick={() => iniciarEjercicio('diafragmatica')}
            >
              <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)' }}
                className="p-6 flex items-center gap-5">
                <span className="text-6xl select-none">🫁</span>
                <div className="flex-1 text-left">
                  <p className="text-white font-bold text-xl leading-tight">
                    Respiración Diafragmática
                  </p>
                  <p className="text-blue-100 text-sm mt-1">
                    Fortalece el diafragma · ~5 min
                  </p>
                  <div className="mt-3 flex gap-2">
                    <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      5 ciclos
                    </span>
                    <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Principiante
                    </span>
                  </div>
                </div>
                <span className="text-white text-2xl select-none">▶</span>
              </div>
            </button>

            {/* Tarjeta Labios Fruncidos */}
            <button
              className="exercise-card w-full"
              onClick={() => iniciarEjercicio('labios')}
            >
              <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                className="p-6 flex items-center gap-5">
                <span className="text-6xl select-none">💨</span>
                <div className="flex-1 text-left">
                  <p className="text-white font-bold text-xl leading-tight">
                    Labios Fruncidos
                  </p>
                  <p className="text-emerald-100 text-sm mt-1">
                    Mejora la exhalación · ~4 min
                  </p>
                  <div className="mt-3 flex gap-2">
                    <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      5 ciclos
                    </span>
                    <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      EPOC · Asma
                    </span>
                  </div>
                </div>
                <span className="text-white text-2xl select-none">▶</span>
              </div>
            </button>

            {/* Tarjeta Huffing */}
            <button
              className="exercise-card w-full"
              onClick={() => iniciarEjercicio('huffing')}
            >
              <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
                className="p-6 flex items-center gap-5">
                <span className="text-6xl select-none">🌬️</span>
                <div className="flex-1 text-left">
                  <p className="text-white font-bold text-xl leading-tight">
                    Limpieza de Vías Aéreas
                  </p>
                  <p className="text-amber-100 text-sm mt-1">
                    Técnica Huffing · Expulsa flemas sin toser
                  </p>
                  <div className="mt-3 flex gap-2">
                    <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      3 ciclos
                    </span>
                    <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Voluntario
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
                Practique en un lugar tranquilo, sentado/a con la espalda recta.
                Si siente mareo, detenga el ejercicio y descanse.
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
              Registrar SpO2 y Disnea
            </button>
          </div>
        )}

        {/* ────────── EJERCICIO ACTIVO ────────── */}
        {(fase === 'diafragmatica' || fase === 'labios' || fase === 'huffing') && !completado && paso && (
          <div className="space-y-4">
            {!enCurso ? (
              <>
                {/* Preview de la instrucción y botón Iniciar */}
                <div className={`phase-panel phase-panel--${paso.tipo} animate-float-up`}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: paso.tipo === 'inhalar' ? '#1d4ed8' : paso.tipo === 'exhalar' ? '#15803d' : paso.tipo === 'mantener' ? '#92400e' : '#475569' }}>{cfg.label}</p>
                  <p className="text-xl font-bold text-gray-800 leading-relaxed">{paso.instruccion}</p>
                </div>

                <div className="flex justify-center">
                  <Button
                    className="w-full max-w-xs"
                    onClick={async () => {
                      await initAudio();
                      setPasoActual(0);
                      setSegundos(ejercicioActivo[0].duracion);
                      setEnCurso(true);
                    }}
                  >
                    Iniciar
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button fullWidth variant="ghost" onClick={() => { setFase('menu'); setCompletado(false); }}>
                    Volver
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Barra de progreso */}
                <div className="mt-2 mb-1">
                  <div className="flex justify-between text-xs text-gray-400 mb-1 px-0.5">
                    <span>Paso {pasoActual + 1} de {ejercicioActivo.length}</span>
                    <span>{Math.round(progreso)}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-in-out"
                      style={{
                        width: `${progreso}%`,
                        background: paso.tipo === 'inhalar' ? '#3b82f6'
                          : paso.tipo === 'exhalar' ? '#10b981'
                          : paso.tipo === 'mantener' ? '#f59e0b'
                          : '#94a3b8',
                      }}
                    />
                  </div>
                </div>

                {/* Panel de instrucción */}
                <div className={`phase-panel phase-panel--${paso.tipo} animate-float-up`}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: paso.tipo === 'inhalar' ? '#1d4ed8' : paso.tipo === 'exhalar' ? '#15803d' : paso.tipo === 'mantener' ? '#92400e' : '#475569' }}>{cfg.label}</p>
                  <p className="text-xl font-bold text-gray-800 leading-relaxed">{paso.instruccion}</p>
                </div>

                {/* Círculo animado de respiración */}
                <div className="flex justify-center py-4">
                  <div className="breath-circle w-44 h-44">
                    <div className={`breath-circle__ring ${cfg.ring} opacity-50 animate-pulse-ring-slow`} />
                    <div className={`breath-circle__ring ${cfg.ring} opacity-60 animate-pulse-ring`} />
                    <div className={`w-44 h-44 rounded-full flex flex-col items-center justify-center shadow-2xl z-10 relative ${cfg.bg} ${cfg.anim}`}>
                      <span className="text-5xl font-black text-white tabular-nums leading-none">{segundos}</span>
                      <span className="text-white/80 text-sm font-semibold mt-1 tracking-wide">seg</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="w-full py-4 rounded-2xl border-2 border-red-200 bg-red-50 text-red-600 font-bold text-base active:scale-95 transition-all hover:bg-red-100" onClick={() => { setFase('menu'); setCompletado(false); setEnCurso(false); stopSpeak(); }}>
                    ✕ Detener ejercicio
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ────────── COMPLETADO ────────── */}
        {completado && (
          <div className="space-y-5 text-center mt-4">
            {/* Tarjeta celebratoria */}
            <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
              className="rounded-3xl p-8 shadow-xl">
              <div className="text-7xl mb-4">🎉</div>
              <h2 className="text-white text-2xl font-black mb-2">¡Ejercicio completado!</h2>
              <p className="text-emerald-100 text-base">
                Ha completado su ejercicio respiratorio.<br />
                <strong className="text-white">¡Excelente trabajo!</strong>
              </p>
            </div>

            {/* Estadística rápida */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex justify-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-black text-emerald-600">
                  {fase === 'diafragmatica' ? '5' : fase === 'labios' ? '5' : '3'}
                </p>
                <p className="text-gray-500 text-xs mt-0.5">ciclos</p>
              </div>
              <div className="w-px bg-gray-200" />
              <div className="text-center">
                <p className="text-3xl font-black text-blue-500">
                  {fase === 'diafragmatica' ? '~5' : fase === 'labios' ? '~4' : '~3'}
                </p>
                <p className="text-gray-500 text-xs mt-0.5">minutos</p>
              </div>
              <div className="w-px bg-gray-200" />
              <div className="text-center">
                <p className="text-3xl font-black text-amber-500">✓</p>
                <p className="text-gray-500 text-xs mt-0.5">completo</p>
              </div>
            </div>

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
              ← Volver al menú
            </Button>
          </div>
        )}

        {/* ────────── REGISTRO ────────── */}
        {fase === 'registro' && (
          <div className="space-y-5 mt-2">
            {/* Cabecera de registro */}
            <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)' }}
              className="rounded-2xl p-5 flex items-center gap-4 shadow-lg">
              <span className="text-5xl">📊</span>
              <div>
                <h2 className="text-white font-bold text-lg leading-tight">Registro respiratorio</h2>
                <p className="text-indigo-100 text-sm mt-0.5">
                  Ingrese su saturación y nivel de disnea
                </p>
              </div>
            </div>

            {alerta && <AlertBanner tipo="critica" mensaje={alerta} onClose={() => setAlerta(null)} />}

            {/* SpO2 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <NumberInput
                label="Saturación de oxígeno (SpO2)"
                value={spo2}
                onChange={setSpo2}
                min={70}
                max={100}
                unit="%"
              />
              {/* Indicador visual SpO2 */}
              <div className="mt-3 flex gap-1 h-2">
                {[...Array(10)].map((_, i) => {
                  const threshold = 70 + i * 3;
                  const active = spo2 >= threshold;
                  const color = threshold >= 94 ? 'bg-emerald-400' : threshold >= 90 ? 'bg-amber-400' : 'bg-red-400';
                  return (
                    <div key={i} className={`flex-1 rounded-full transition-all ${active ? color : 'bg-gray-200'}`} />
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-1 text-right">
                {spo2 >= 94 ? '✅ Normal' : spo2 >= 90 ? '⚠️ Bajo' : '🔴 Muy bajo'}
              </p>
            </div>

            {/* Disnea */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <SliderInput
                label="Dificultad para respirar (disnea)"
                value={disnea}
                onChange={setDisnea}
                min={1}
                max={10}
              />
              <p className="text-sm text-gray-400 mt-2 text-center">
                1 = Sin dificultad · 10 = Muy difícil respirar
              </p>
            </div>

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
