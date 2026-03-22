'use client';

import { useState, useEffect } from 'react';
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
  { texto: '🫁 Inhale profundo por la nariz... 1... 2... 3... 4...', duracion: 5 },
  { texto: '⏸️ Mantenga el aire tranquilamente...', duracion: 4 },
  { texto: '💨 Exhale muy lento por la boca... 1... 2... 3... 4... 5... 6...', duracion: 7 },
  { texto: '🫁 Inhale de nuevo... sienta cómo entra el aire fresco...', duracion: 5 },
  { texto: '⏸️ Mantenga... está tranquilo/a...', duracion: 4 },
  { texto: '💨 Exhale... deje ir todas las preocupaciones...', duracion: 7 },
  { texto: '🫁 Inhale paz y calma...', duracion: 5 },
  { texto: '💨 Exhale tensión y estrés...', duracion: 7 },
  { texto: '🫁 Último: Inhale profundamente...', duracion: 5 },
  { texto: '💨 Exhale completamente... relájese...', duracion: 7 },
  { texto: '✨ Abra los ojos lentamente. Se siente más tranquilo/a.', duracion: 5 },
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

  const iniciar = (tipo: Actividad, datos: PasoGuiado[]) => {
    setPasos(datos);
    setPasoActual(0);
    setSegundos(datos[0].duracion);
    setCompletado(false);
    setGuardado(false);
    setActividad(tipo);
  };

  useEffect(() => {
    if (actividad === 'menu' || completado) return;

    const timer = setInterval(() => {
      setSegundos((prev) => {
        if (prev <= 1) {
          const sig = pasoActual + 1;
          if (sig >= pasos.length) {
            setCompletado(true);
            return 0;
          }
          setPasoActual(sig);
          return pasos[sig].duracion;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [actividad, pasoActual, pasos, completado]);

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

  const paso = pasos[pasoActual];

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

            <Button fullWidth onClick={() => iniciar('respiracion', RESPIRACION_GUIADA)}>
              🫁 Respiración Calmante
            </Button>
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
            {/* Progreso */}
            <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-purple-500 h-full transition-all duration-500"
                style={{ width: `${((pasoActual + 1) / pasos.length) * 100}%` }}
              />
            </div>

            {/* Instrucción */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-8 text-center min-h-[200px] flex items-center justify-center">
              <p className="text-2xl font-medium text-gray-800 leading-relaxed">
                {paso.texto}
              </p>
            </div>

            {/* Timer visual */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-3xl font-bold text-purple-600">{segundos}</span>
              </div>
            </div>

            <Button fullWidth variant="danger" onClick={() => { setActividad('menu'); setCompletado(false); }}>
              Detener
            </Button>
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
