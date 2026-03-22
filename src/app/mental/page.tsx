'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import AlertBanner from '@/components/ui/AlertBanner';
import { guardarRegistro, fechaHoy } from '@/lib/db';
import historyLib from '@/lib/history';

type Actividad = 'menu' | 'respiracion' | 'relajacion' | 'visualizacion';

interface PasoGuiado {
  texto: string;
  duracion: number;
}

const RESPIRACION_GUIADA: PasoGuiado[] = [
  { texto: 'Cierre los ojos suavemente...', duracion: 5 },
  { texto: 'Relaje los hombros, suelte la tensión...', duracion: 5 },
  { texto: '🫁 Inhale profundo por la nariz...', duracion: 5 },
  { texto: '⏸️ Mantenga el aire tranquilamente...', duracion: 4 },
  { texto: '💨 Exhale muy lento por la boca...', duracion: 7 },
  { texto: '🫁 Inhale de nuevo... sienta cómo entra el aire fresco...', duracion: 5 },
  { texto: '⏸️ Mantenga... esté tranquila...', duracion: 4 },
  { texto: '💨 Exhale... deje ir todas las preocupaciones...', duracion: 7 },
  { texto: '🫁 Inhale paz y calma...', duracion: 5 },
  { texto: '💨 Exhale tensión y estrés...', duracion: 7 },
  { texto: '🫁 Último: Inhale profundamente...', duracion: 5 },
  { texto: '💨 Exhale completamente... relájese...', duracion: 7 },
  { texto: '✨ Abra los ojos lentamente. Se siente más tranquila?.', duracion: 5 },
];

const RELAJACION_MUSCULAR: PasoGuiado[] = [
  { texto: 'Siéntese o acuéstese cómodamente...', duracion: 5 },
  { texto: '✋ Cierre los puños con fuerza... mantenga 5 segundos...', duracion: 6 },
  { texto: '🤲 Suelte... sienta cómo se relajan las manos...', duracion: 5 },
  { texto: '💪 Tense los brazos... mantenga...', duracion: 6 },
  { texto: '😌 Suelte... respire...', duracion: 5 },
  { texto: '🦶 Tense los pies apretando los dedos... mantenga...', duracion: 6 },
  { texto: '😌 Suelte... sienta la relajación subir por las piernas...', duracion: 5 },
  { texto: '😤 Tense la cara (frunza el ceño)... mantenga...', duracion: 5 },
  { texto: '😌 Suelte todo... relaje cada músculo de la cara...', duracion: 5 },
  { texto: '🌊 Ahora todo el cuerpo está relajado... respire normalmente...', duracion: 8 },
  { texto: '✨ Quédese así un momento más... disfrute la calma...', duracion: 8 },
];

const VISUALIZACION: PasoGuiado[] = [
  { texto: 'Cierre los ojos... respire suave...', duracion: 5 },
  { texto: '🏖️ Imagine un lugar tranquilo... puede ser una playa, un campo, un jardín...', duracion: 8 },
  { texto: '👀 Mire los colores... el cielo azul, el verde del pasto...', duracion: 8 },
  { texto: '👂 Escuche los sonidos... el viento, las olas, los pájaros...', duracion: 8 },
  { texto: '🌬️ Sienta la brisa suave en su cara...', duracion: 7 },
  { texto: '☀️ El sol le da calidez... está seguro/a y en paz...', duracion: 8 },
  { texto: '💚 Sienta gratitud por este momento de calma...', duracion: 7 },
  { texto: '🫁 Respire profundo... lleve esa paz consigo...', duracion: 6 },
  { texto: '✨ Cuando esté listo/a, abra los ojos lentamente...', duracion: 5 },
];

export default function MentalPage() {
  const [actividad, setActividad] = useState<Actividad>('menu');
  const [pasoActual, setPasoActual] = useState(0);
  const [segundos, setSegundos] = useState(0);
  const [pasos, setPasos] = useState<PasoGuiado[]>([]);
  const [completado, setCompletado] = useState(false);
  const [guardado, setGuardado] = useState(false);
  // la voz siempre está activa; no hay control para desactivarla
  const vozActiva = true;
  // indica si la sesión está en ejecución (cronómetro/voz/ambient activo)
  const [enCurso, setEnCurso] = useState<boolean>(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // cargar voces en cuanto estén disponibles (el evento voiceschanged es necesario en Chrome)
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const load = () => { voicesRef.current = window.speechSynthesis.getVoices(); };
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  // audio ambiental (ruido filtrado tipo agua/viento)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);
  const noiseFilterRef = useRef<BiquadFilterNode | null>(null);

  const paso = pasos[pasoActual];

  const iniciar = (tipo: Actividad, datos: PasoGuiado[]) => {
    setPasos(datos);
    setPasoActual(0);
    // preparar pero no iniciar: el usuario debe pulsar "Iniciar"
    setSegundos(datos[0].duracion);
    setEnCurso(false);
    setCompletado(false);
    setGuardado(false);
    setActividad(tipo);
  };

  const speak = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();

      // convertir puntos suspensivos en pausas reales con comas y silencios
      const withPauses = text
        .replace(/\.\.\./g, '... ')          // mantener pero espaciar
        .replace(/(\d)\.\.\./g, '$1... ')    // números seguidos de puntos
        .replace(/\s+/g, ' ')
        .trim();

      const u = new SpeechSynthesisUtterance(withPauses);
      u.lang = 'es-ES';
      u.rate = 0.95;   // lenta y calmada
      u.pitch = 0.90;  // tono suave, más grave
      u.volume = 0.85;

      // orden de preferencia: Google Neural > Google > voces locales conocidas
      const voices = voicesRef.current;
      const rank = (v: SpeechSynthesisVoice) => {
        const n = v.name.toLowerCase();
        const l = (v.lang || '').toLowerCase();
        if (!l.startsWith('es')) return 0;
        if (n.includes('google') && (l === 'es-us' || l === 'es-419')) return 100;
        if (n.includes('google')) return 90;
        if (['mónica', 'monica', 'lucía', 'lucia', 'paulina', 'jorge', 'soledad'].some(p => n.includes(p))) return 80;
        if (l.startsWith('es')) return 50;
        return 0;
      };
      const best = voices
        .filter(v => rank(v) > 0)
        .sort((a, b) => rank(b) - rank(a))[0];
      if (best) u.voice = best;

      utterRef.current = u;
      window.speechSynthesis.speak(u);
    } catch (e) {
      // ignore
    }
  };

  const stopSpeak = () => {
    try { window.speechSynthesis.cancel(); utterRef.current = null; } catch { }
  };

  useEffect(() => {
    if (actividad === 'menu' || completado || !enCurso) return;

    const timer = setInterval(() => {
      setSegundos((prev) => {
        if (prev <= 1) {
          const sig = pasoActual + 1;
          if (sig >= pasos.length) {
            setCompletado(true);
            setEnCurso(false);
            return 0;
          }
          setPasoActual(sig);
          return pasos[sig].duracion;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [actividad, pasoActual, pasos, completado, enCurso]);

  // reproducir voz cuando cambia el paso y si está activada
  useEffect(() => {
    // la voz siempre debe reproducirse durante la sesión, pero solo si está en curso
    if (actividad === 'menu' || completado || !enCurso) return;
    if (!paso) return;
    // limpiar texto (sin emojis) antes de hablar; la función speak ya maneja silencios
    const clean = (t: string) => {
      try {
        // eliminar emojis y símbolos pictográficos
        let s = t.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, '');
        // eliminar comas y reducir espacios
        s = s.replace(/,/g, '');
        s = s.replace(/[\u2000-\u206F]/g, '');
        s = s.replace(/\s+/g, ' ').trim();
        return s;
      } catch (e) { return t; }
    };

    const cleaned = clean(paso.texto);
    playBreathCue(paso.texto); // tono guía según inhalar/exhalar/mantener
    speak(cleaned);
    return () => { /* no-op */ };
  }, [paso?.texto, vozActiva, actividad, completado, enCurso]);

  // --- Ambient audio helpers ---
  const initAmbient = () => {
    if (audioCtxRef.current) return;
    try {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      audioCtxRef.current = ctx;
    } catch (e) {
      audioCtxRef.current = null;
    }
  };

  const startAmbient = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    stopAmbient();

    // crear buffer de ruido blanco y filtrarlo para sonido tipo agua/viento
    const bufferSize = ctx.sampleRate * 2; // 2s buffer
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.2;

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1200;

    const gain = ctx.createGain();
    gain.gain.value = 0.06; // bajo volumen

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    src.start();
    noiseSourceRef.current = src;
    noiseGainRef.current = gain;
    noiseFilterRef.current = filter;
  };

  const stopAmbient = () => {
    try {
      if (noiseSourceRef.current) {
        noiseSourceRef.current.stop();
        noiseSourceRef.current.disconnect();
        noiseSourceRef.current = null;
      }
      if (noiseGainRef.current) { noiseGainRef.current.disconnect(); noiseGainRef.current = null; }
      if (noiseFilterRef.current) { noiseFilterRef.current.disconnect(); noiseFilterRef.current = null; }
    } catch (e) { /* noop */ }
  };

  /**
   * Reproduce un tono suave que guía la respiración:
   *  - inhalar  → tono ascendente (180 → 340 Hz)
   *  - exhalar  → tono descendente (340 → 160 Hz)
   *  - mantener → campana breve y suave (260 Hz)
   *  - otros    → campanilla tenue de transición (440 Hz decay)
   */
  const playBreathCue = (texto: string) => {
    initAmbient(); // asegura que AudioContext esté listo
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    try {
      const t = texto.toLowerCase();
      let type: 'inhale' | 'exhale' | 'hold' | 'step';
      if (/inhal|inspir/.test(t)) type = 'inhale';
      else if (/exhal|espir|suelt/.test(t)) type = 'exhale';
      else if (/manten|pausa/.test(t)) type = 'hold';
      else type = 'step';

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0, now);
      osc.type = 'sine';

      if (type === 'inhale') {
        // tono ascendente suave — invita a respirar
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(340, now + 2.5);
        gain.gain.linearRampToValueAtTime(0.09, now + 0.3);
        gain.gain.setValueAtTime(0.09, now + 2.0);
        gain.gain.linearRampToValueAtTime(0, now + 2.8);
        osc.start(now);
        osc.stop(now + 3);
      } else if (type === 'exhale') {
        // tono descendente suave — invita a soltar
        osc.frequency.setValueAtTime(340, now);
        osc.frequency.linearRampToValueAtTime(160, now + 3.5);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.2);
        gain.gain.setValueAtTime(0.08, now + 3.0);
        gain.gain.linearRampToValueAtTime(0, now + 3.8);
        osc.start(now);
        osc.stop(now + 4);
      } else if (type === 'hold') {
        // campana suave y breve — indica pausa
        osc.frequency.setValueAtTime(260, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.15);
        gain.gain.setValueAtTime(0.06, now + 0.6);
        gain.gain.linearRampToValueAtTime(0, now + 1.2);
        osc.start(now);
        osc.stop(now + 1.5);
      } else {
        // campanilla tenue de transición entre pasos
        osc.frequency.setValueAtTime(528, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
        osc.start(now);
        osc.stop(now + 1.5);
      }
    } catch (e) { /* ignore */ }
  };

  // iniciar/stop ambient según actividad
  useEffect(() => {
    initAmbient();
    if (actividad !== 'menu' && !completado && enCurso) {
      startAmbient();
    } else {
      stopAmbient();
    }
    return () => { stopAmbient(); };
  }, [actividad, completado, enCurso]);

  const guardarSesion = async () => {
    await guardarRegistro({
      fecha: fechaHoy(),
      tipo: 'mental',
      datos: { actividad, completado: true },
      timestamp: Date.now(),
    });
    try {
      await historyLib.addHistory('mental registrado', { actividad, fecha: fechaHoy() });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('No se pudo guardar historial mental:', e);
    }
    setGuardado(true);
  };

  // cuando la sesión termina, guardar automáticamente y anunciar con voz
  useEffect(() => {
    if (!completado) return;
    try {
      // tocar un tono de felicitación
      try { playBreathCue('felicitacion'); } catch (e) { /* noop */ }
      // anunciar al usuario
      speak('Has completado tu sesión. Muy bien, felicidades. Tómate un momento para notar la calma.');
    } catch (e) { /* noop */ }
    // guardar en segundo plano
    (async () => { try { await guardarSesion(); } catch (e) { /* noop */ } })();
  }, [completado]);


  return (
    <>
      <Header titulo="🧘 Bienestar Mental" mostrarVolver />
      <div className="p-4 space-y-4">
        {actividad === 'menu' && (
          <>
            <Card icon="🧘" title="Cuide su mente" color="purple">
              <p className="text-gray-600 text-lg">
                Su bienestar mental es tan importante como el físico. Estos ejercicios le ayudarán a sentirse más tranquilo/a y con mejor ánimo.
              </p>
            </Card>

            <div>
              <Button fullWidth onClick={() => iniciar('respiracion', RESPIRACION_GUIADA)}>
                🫁 Respiración Calmante
              </Button>
            </div>
            <p className="text-gray-500 text-center text-sm">Reduce ansiedad · ~2 min</p>

            <Button fullWidth variant="secondary" onClick={() => iniciar('relajacion', RELAJACION_MUSCULAR)}>
              😌 Relajación Muscular
            </Button>
            <p className="text-gray-500 text-center text-sm">Libere tensión del cuerpo · ~2 min</p>

            <Button fullWidth variant="ghost" onClick={() => iniciar('visualizacion', VISUALIZACION)}>
              🏖️ Visualización Guiada
            </Button>
            <p className="text-gray-500 text-center text-sm">Imagine un lugar de paz · ~2 min</p>
          </>
        )}

        {actividad !== 'menu' && !completado && paso && (
          <div className="space-y-4">
            {!enCurso ? (
              <>
                {/* Preview de la instrucción y botón Iniciar */}
                <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-8 text-center min-h-[200px] flex items-center justify-center">
                  <p className="text-2xl font-medium text-gray-800 leading-relaxed">{paso.texto}</p>
                </div>

                <div className="flex justify-center">
                  <Button
                    className="w-full max-w-xs"
                    onClick={() => {
                      setPasoActual(0);
                      setSegundos(pasos[0].duracion);
                      setEnCurso(true);
                    }}
                  >
                    Iniciar
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button fullWidth variant="ghost" onClick={() => { setActividad('menu'); setCompletado(false); }}>
                    Volver
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Progreso */}
                <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-purple-500 h-full transition-all duration-500"
                    style={{ width: `${((pasoActual + 1) / pasos.length) * 100}%` }}
                  />
                </div>

                {/* Instrucción */}
                <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-8 text-center min-h-[200px] flex items-center justify-center">
                  <p className="text-2xl font-medium text-gray-800 leading-relaxed">{paso.texto}</p>
                </div>

                {/* Timer visual */}
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-3xl font-bold text-purple-600">{segundos}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button fullWidth variant="danger" onClick={() => { setActividad('menu'); setCompletado(false); stopSpeak(); setEnCurso(false); }}>
                    Detener
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {completado && (
          <div className="space-y-4 text-center">
            <Card icon="✨" title="Sesión completada" color="purple">
              <p className="text-lg text-gray-700">
                Ha completado su ejercicio de bienestar mental. Tómese un momento para disfrutar la calma.
              </p>
            </Card>

            {guardado ? (
              <AlertBanner tipo="exito" mensaje="Sesión registrada" />
            ) : (
              <Button fullWidth onClick={guardarSesion}>
                💾 Registrar sesión
              </Button>
            )}

            <Button fullWidth variant="ghost" onClick={() => { setActividad('menu'); setCompletado(false); }}>
              Volver al menú
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
