'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Header from '@/components/Header';
import DashboardPC from '@/components/DashboardPC';
import Button from '@/components/ui/Button';
import SliderInput from '@/components/ui/SliderInput';
import { guardarRegistro, fechaHoy } from '@/lib/db';
import { ensureAudioUnlocked } from '@/lib/sounds';

/* ════════════════════════════════════════════════════════════════════════════
   TIPOS
   ════════════════════════════════════════════════════════════════════════════ */

type TipoTarea = 'control' | 'medicacion' | 'alimentacion' | 'respiracion' | 'ejercicio' | 'descanso' | 'registro' | 'meditacion';
type TipoPaso = 'inhalar' | 'exhalar' | 'mantener' | 'descanso' | 'activo' | 'preparacion' | 'alerta';

interface PasoEjercicio {
  instruccion: string;
  duracion: number;
  tipo: TipoPaso;
}

interface Tarea {
  id: string;
  hora: string;
  titulo: string;
  descripcion: string;
  tipo: TipoTarea;
  detalle?: string;
  medicamentos?: string[];
  ejercicioId?: string;   // si tiene, abre modal guiado
}

interface Bloque {
  id: string;
  nombre: string;
  icono: string;
  rango: string;
  color: string;
  borderColor: string;
  tareas: Tarea[];
}

/* ════════════════════════════════════════════════════════════════════════════
   EJERCICIOS GUIADOS
   ════════════════════════════════════════════════════════════════════════════ */

const EJERCICIO_RESPIRACION_DORADA: PasoEjercicio[] = [
  { instruccion: 'Quédese acostada con los ojos cerrados. Relaje todo el cuerpo.', duracion: 6, tipo: 'descanso' },
  { instruccion: '🌟 Imagine una luz dorada frente a usted...', duracion: 5, tipo: 'descanso' },
  { instruccion: '🫁 INHALE lento por la nariz... esa luz dorada entra y llena sus pulmones', duracion: 5, tipo: 'inhalar' },
  { instruccion: '💨 EXHALE lento por la boca... el aire gris y enfermo sale de su cuerpo', duracion: 6, tipo: 'exhalar' },
  { instruccion: '🫁 INHALE... la luz dorada sana sus pulmones por dentro', duracion: 5, tipo: 'inhalar' },
  { instruccion: '💨 EXHALE... libere toda la tensión del cuerpo', duracion: 6, tipo: 'exhalar' },
  { instruccion: '🫁 INHALE... sienta el aire limpio llenándola de energía', duracion: 5, tipo: 'inhalar' },
  { instruccion: '💨 EXHALE... suelte todo lo que le pesa, está a salvo', duracion: 6, tipo: 'exhalar' },
  { instruccion: '🫁 INHALE profundo... la luz dorada llega hasta su corazón', duracion: 5, tipo: 'inhalar' },
  { instruccion: '💨 EXHALE suavemente... siente paz y tranquilidad', duracion: 6, tipo: 'exhalar' },
  { instruccion: '🫁 INHALE... último ciclo, llenando todo de luz', duracion: 5, tipo: 'inhalar' },
  { instruccion: '💨 EXHALE largo y lento... muy bien hecho', duracion: 6, tipo: 'exhalar' },
  { instruccion: '✨ Quédese quieta unos segundos. Sienta cómo todo está más calmado.', duracion: 8, tipo: 'descanso' },
  { instruccion: '✅ ¡Excelente! Respiración Dorada completada. Puede abrir los ojos.', duracion: 5, tipo: 'descanso' },
];

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
  { instruccion: '🫁 INHALE profundo y tranquilo por la nariz...', duracion: 4, tipo: 'inhalar' },
  { instruccion: '⏸️ Mantenga el aire...', duracion: 3, tipo: 'mantener' },
  { instruccion: '💨 HUFF 1 — Boca en círculo: "Jaaaaff"', duracion: 3, tipo: 'exhalar' },
  { instruccion: '💨 HUFF 2 — Repita: "Jaaaaff"', duracion: 3, tipo: 'exhalar' },
  { instruccion: '✨ Descanse... respire con normalidad unos segundos', duracion: 6, tipo: 'descanso' },
  { instruccion: '🫁 INHALE profundo y tranquilo por la nariz...', duracion: 4, tipo: 'inhalar' },
  { instruccion: '⏸️ Mantenga el aire 2-3 segundos...', duracion: 3, tipo: 'mantener' },
  { instruccion: '💨 HUFF 1 — Boca en círculo: "Jaaaaff"', duracion: 3, tipo: 'exhalar' },
  { instruccion: '💨 HUFF 2 — Repita: "Jaaaaff"', duracion: 3, tipo: 'exhalar' },
  { instruccion: '✨ Descanse... respire con calma', duracion: 6, tipo: 'descanso' },
  { instruccion: '🫁 INHALE profundo y tranquilo... último ciclo', duracion: 4, tipo: 'inhalar' },
  { instruccion: '⏸️ Mantenga el aire...', duracion: 3, tipo: 'mantener' },
  { instruccion: '💨 HUFF 1 — Boca en círculo: "Jaaaaff"', duracion: 3, tipo: 'exhalar' },
  { instruccion: '💨 HUFF 2 — Último huff: "Jaaaaff"', duracion: 3, tipo: 'exhalar' },
  { instruccion: '✅ ¡Excelente! Ha completado la limpieza bronquial', duracion: 5, tipo: 'descanso' },
];

const EJERCICIO_LABIOS: PasoEjercicio[] = [
  { instruccion: 'Siéntese relajada', duracion: 5, tipo: 'descanso' },
  { instruccion: 'Cierre la boca. Relaje los hombros. Frunza los labios como si fuera a silbar', duracion: 5, tipo: 'descanso' },
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

const EJERCICIO_MOVILIDAD_SILLA: PasoEjercicio[] = [
  { instruccion: 'Siéntese en una silla firme con la espalda bien apoyada', duracion: 6, tipo: 'preparacion' },
  { instruccion: 'Pies planos en el suelo, manos en los muslos', duracion: 5, tipo: 'preparacion' },
  { instruccion: '🛑 Si siente mareo o falta de aire, deténgase y descanse', duracion: 5, tipo: 'alerta' },
  // Talones – serie 1 (10 reps)
  { instruccion: '🦶 Levante ambos talones del suelo... y baje. (1 de 10)', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Suba talones... y baje. (2 de 10)', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Suba... y baje. (3 de 10)', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Suba... y baje. (4 de 10)', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Suba... y baje. (5 de 10)', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Suba... y baje. (6 de 10)', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Suba... y baje. (7 de 10)', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Suba... y baje. (8 de 10)', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Suba... y baje. (9 de 10)', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Último. Suba... y baje. (10 de 10)', duracion: 3, tipo: 'activo' },
  { instruccion: '✨ Descanse unos segundos...', duracion: 8, tipo: 'descanso' },
  // Talones – serie 2
  { instruccion: '🦶 Segunda serie. Suba talones... y baje. (1 de 10)', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Suba... y baje. (2 de 10)', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Suba... y baje. (3 de 10)', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Suba... y baje. (4 de 10)', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Suba... y baje. (5 de 10)', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Suba... y baje. (6 de 10)', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Suba... y baje. (7 de 10)', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Suba... y baje. (8 de 10)', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Suba... y baje. (9 de 10)', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 Último. Suba... y baje. (10 de 10)', duracion: 3, tipo: 'activo' },
  { instruccion: '✨ ¡Muy bien! Ahora los hombros. Descanse unos segundos.', duracion: 8, tipo: 'descanso' },
  // Hombros
  { instruccion: '💪 Haga círculos con los hombros hacia ATRÁS. Lento y suave.', duracion: 10, tipo: 'activo' },
  { instruccion: '💪 Ahora círculos hacia ADELANTE. Lento y suave.', duracion: 10, tipo: 'activo' },
  { instruccion: '✅ ¡Ejercicio completado! Descanse tranquila.', duracion: 6, tipo: 'descanso' },
];

const EJERCICIO_CAMINATA: PasoEjercicio[] = [
  { instruccion: '⚠️ Asegúrese de tener el oxígeno puesto antes de empezar', duracion: 6, tipo: 'alerta' },
  { instruccion: 'Póngase de pie con calma, apóyese si lo necesita', duracion: 6, tipo: 'preparacion' },
  { instruccion: '🚶 Comience a caminar MUY lento. Inhale: 2 pasos. Exhale con labios fruncidos: 4 pasos.', duracion: 60, tipo: 'activo' },
  { instruccion: '✨ Descanse. Siéntese si lo necesita. Respire con calma.', duracion: 30, tipo: 'descanso' },
  { instruccion: '🚶 Camine de nuevo, lento. Inhale: 2 pasos. Exhale con labios fruncidos: 4 pasos.', duracion: 60, tipo: 'activo' },
  { instruccion: '✨ Descanse. Respire tranquila. Revise su saturación.', duracion: 30, tipo: 'descanso' },
  { instruccion: '🚶 Último tramo. Camine a su ritmo. Inhale: 2 pasos. Exhale: 4 pasos.', duracion: 60, tipo: 'activo' },
  { instruccion: '✨ Pare y descanse. Siéntese.', duracion: 20, tipo: 'descanso' },
  { instruccion: '✅ ¡Caminata completada! Quédese sentada y recupere el aliento.', duracion: 6, tipo: 'descanso' },
];

const EJERCICIOS: Record<string, { pasos: PasoEjercicio[]; nombre: string }> = {
  'respiracion-dorada':  { pasos: EJERCICIO_RESPIRACION_DORADA, nombre: 'Respiración Dorada' },
  'diafragmatica':       { pasos: EJERCICIO_DIAFRAGMATICO, nombre: 'Respiración Diafragmática' },
  'huffing':             { pasos: EJERCICIO_HUFFING, nombre: 'Limpieza Bronquial (Huffing)' },
  'labios-fruncidos':    { pasos: EJERCICIO_LABIOS, nombre: 'Respiración Labios Fruncidos' },
  'movilidad-silla':     { pasos: EJERCICIO_MOVILIDAD_SILLA, nombre: 'Movilidad en Silla' },
  'caminata':            { pasos: EJERCICIO_CAMINATA, nombre: 'Caminata Terapéutica' },
};

/* ════════════════════════════════════════════════════════════════════════════
   ICONOS
   ════════════════════════════════════════════════════════════════════════════ */

const ICONOS_TIPO: Record<TipoTarea, string> = {
  control: '📋', medicacion: '💊', alimentacion: '🍽️', respiracion: '🫁',
  ejercicio: '🚶', descanso: '😴', registro: '📝', meditacion: '🧘',
};

/* ════════════════════════════════════════════════════════════════════════════
   DATOS DEL PROTOCOLO
   ════════════════════════════════════════════════════════════════════════════ */

const PROTOCOLO: Bloque[] = [
  {
    id: 'despertar', nombre: 'Despertar y Activación', icono: '🌅',
    rango: '08:00 – 11:00', color: 'bg-amber-50', borderColor: 'border-amber-300',
    tareas: [
      { id: 'd1', hora: '08:00', titulo: 'Respiración Dorada', descripcion: 'Antes de bajar los pies de la cama, 5 min imaginando aire limpio.', tipo: 'respiracion', ejercicioId: 'respiracion-dorada' },
      { id: 'd2', hora: '08:15', titulo: 'Control de Signos Vitales', descripcion: 'Medir saturación, pulso, presión y peso.', tipo: 'control', ejercicioId: 'control-signos' },
      { id: 'd3', hora: '09:00', titulo: 'Desayuno + Medicación AM', descripcion: 'Avena con nueces o claras con espinaca. Cero sal.', tipo: 'medicacion', medicamentos: ['Prednisona 10mg', 'Xarelto 15mg', 'Rosuvastatina 10mg', 'Micofenolato 500mg'], detalle: 'Tome los medicamentos CON el desayuno. Nunca en ayunas.\n\nOpciones de desayuno:\n• Avena con nueces y fruta picada\n• Claras de huevo revueltas con espinaca\n• Pan integral con palta\n\n⚠️ SIN SAL en ninguna preparación.' },
      { id: 'd4', hora: '10:00', titulo: 'Respiración Diafragmática', descripcion: 'Sentada con espalda apoyada, 5 minutos.', tipo: 'respiracion', ejercicioId: 'diafragmatica' },
      { id: 'd5', hora: '10:30', titulo: 'Movilidad en Silla', descripcion: 'Elevación de talones (20 veces) y círculos de hombros.', tipo: 'ejercicio', ejercicioId: 'movilidad-silla' },
    ],
  },
  {
    id: 'nutricion', nombre: 'Nutrición y Terapia', icono: '☀️',
    rango: '12:00 – 17:00', color: 'bg-sky-50', borderColor: 'border-sky-300',
    tareas: [
      { id: 'n1', hora: '12:30', titulo: 'Almuerzo Cardiorrenal', descripcion: 'Pescado o pollo a la plancha con vegetales cocidos.', tipo: 'alimentacion', detalle: 'Opciones:\n• Pescado a la plancha con zapallo y zanahoria\n• Pollo a la plancha con verduras cocidas\n\n🌿 Use cúrcuma y limón en vez de sal.\n⚠️ Evite embutidos, enlatados y todo alto en sodio.' },
      { id: 'n2', hora: '14:00', titulo: 'Siesta Obligatoria', descripcion: '30 a 45 minutos. Cabecera elevada a 45°.', tipo: 'descanso', detalle: 'Use 2 o 3 almohadas para mantener la cabecera elevada a 45 grados. Esto facilita el trabajo del corazón.\n\nDuración: entre 30 y 45 minutos. Ponga una alarma suave.' },
      { id: 'n3', hora: '15:30', titulo: 'Limpieza Bronquial (Huffing)', descripcion: 'Con oxígeno puesto. Para mover las flemas.', tipo: 'respiracion', ejercicioId: 'huffing' },
      { id: 'n4', hora: '16:00', titulo: 'Caminata Terapéutica', descripcion: '5 a 10 min, paso muy lento, con oxígeno.', tipo: 'ejercicio', ejercicioId: 'caminata' },
    ],
  },
  {
    id: 'cierre', nombre: 'Cierre y Reparación', icono: '🌙',
    rango: '18:00 – 22:30', color: 'bg-indigo-50', borderColor: 'border-indigo-300',
    tareas: [
      { id: 'c1', hora: '18:00', titulo: 'Colación y Meditación', descripcion: 'Fruta picada o frutos secos. 10 min de música relajante.', tipo: 'meditacion', detalle: 'Opciones de colación:\n• Fruta picada (manzana, pera, plátano)\n• Un puñado de frutos secos (nueces, almendras)\n\nLuego: 10 minutos de música relajante a 432Hz. Busque "música 432Hz" en YouTube.' },
      { id: 'c2', hora: '20:00', titulo: 'Cena Ligera', descripcion: 'Crema de verduras o sopa clara. Nada pesado.', tipo: 'alimentacion', detalle: 'Opciones:\n• Crema de verduras (zapallo, zanahoria, zapallito)\n• Sopa clara de pollo con verduras\n\n⚠️ Evite comidas pesadas: el abdomen hinchado presiona los pulmones.' },
      { id: 'c3', hora: '21:30', titulo: 'Registro de Síntomas', descripcion: '¿Hinchazón? ¿Tos? ¿Manchas? Revisar cómo estuvo el día.', tipo: 'registro', ejercicioId: 'registro-sintomas' },
      { id: 'c4', hora: '22:00', titulo: 'Respiración de Labios Fruncidos', descripcion: '5 minutos para inducir sueño profundo.', tipo: 'respiracion', ejercicioId: 'labios-fruncidos' },
      { id: 'c5', hora: '22:30', titulo: 'Medicación de Noche', descripcion: 'Tomar medicamentos y revisar humidificador del oxígeno.', tipo: 'medicacion', medicamentos: ['Bisoprolol 1.25mg', 'Amlodipino 5mg', 'Espironolactona 0.5mg', 'Valax D'], detalle: 'Tome los medicamentos con un poco de agua.\n\nAntes de dormir:\n✅ Revise que el humidificador tenga agua limpia.\n✅ Verifique mascarilla o cánula bien puestas.\n✅ Duerma con la cabecera elevada.' },
    ],
  },
];

/* ════════════════════════════════════════════════════════════════════════════
   GUÍAS EXTRA
   ════════════════════════════════════════════════════════════════════════════ */

interface Guia { id: string; titulo: string; icono: string; contenido: string; ejercicioId?: string; }

const GUIAS: Guia[] = [
  { id: 'huffing-info', titulo: 'Cómo quitar Flemas (Huffing)', icono: '🫁', contenido: 'Evita la tos violenta que agota y baja la saturación.\n\n¿Cuándo hacerlo?\n• Si siente el "pecho apretado"\n• Después de la caminata\n\n⚠️ Si sale flema con sangre, avise al médico (por el Xarelto).', ejercicioId: 'huffing' },
  { id: 'labios-info', titulo: 'Respiración con Labios Fruncidos', icono: '💋', contenido: 'La "llave maestra" cuando falta el aire.\n\n1. Inhale por la nariz: uno... dos...\n2. Labios como para dar un beso\n3. Exhale MUY lento: uno... dos... tres... cuatro... cinco... seis...\n\nMantiene los alveolos abiertos más tiempo.', ejercicioId: 'labios-fruncidos' },
  { id: 'cuidador', titulo: 'Consejos para el Cuidador', icono: '🤝', contenido: '🧴 PIEL: Prednisona + Xarelto = piel muy delicada. Evite roces fuertes. Registre manchas moradas nuevas.\n\n🚿 BAÑO: Use silla de baño. Oxígeno puesto durante y después de la ducha.\n\n💬 PREGUNTA DIARIA: "Del 1 al 10, ¿cuánta energía tienes?"\n• Menos de 4 → solo respiración en cama\n• 4 a 6 → caminata corta (5 min)\n• 7+ → protocolo completo' },
];

/* ════════════════════════════════════════════════════════════════════════════
   REGISTRO DE SÍNTOMAS
   ════════════════════════════════════════════════════════════════════════════ */

interface PreguntaSintoma { id: string; texto: string; icono: string; }

const PREGUNTAS_SINTOMAS: PreguntaSintoma[] = [
  { id: 'hinchazon', texto: '¿Sus pies o tobillos están hinchados hoy?', icono: '🦶' },
  { id: 'tos', texto: '¿Tosió más de lo normal?', icono: '😷' },
  { id: 'disnea', texto: '¿Tuvo dificultad para respirar?', icono: '😮‍💨' },
  { id: 'manchas', texto: '¿Apareció alguna mancha morada nueva en la piel?', icono: '🟣' },
  { id: 'flema_sangre', texto: '¿Salió flema con sangre?', icono: '🩸' },
  { id: 'mareo', texto: '¿Tuvo mareos o se sintió débil?', icono: '💫' },
  { id: 'apetito', texto: '¿Comió bien hoy?', icono: '🍽️' },
  { id: 'sueno', texto: '¿Durmió bien anoche?', icono: '😴' },
];

/* ════════════════════════════════════════════════════════════════════════════
   LOCAL STORAGE
   ════════════════════════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'protocolo-checks';
const SINTOMAS_KEY = 'protocolo-sintomas';

function todayStr() { return new Date().toISOString().slice(0, 10); }

function getChecks(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try { const p = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); return p._date === todayStr() ? p : {}; } catch { return {}; }
}
function saveChecks(c: Record<string, boolean>) {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...c, _date: todayStr() }));
}

function getSintomas(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try { const p = JSON.parse(localStorage.getItem(SINTOMAS_KEY) || '{}'); return p._date === todayStr() ? p : {}; } catch { return {}; }
}
function saveSintomas(s: Record<string, boolean>) {
  if (typeof window !== 'undefined') localStorage.setItem(SINTOMAS_KEY, JSON.stringify({ ...s, _date: todayStr() }));
}

/* ════════════════════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════════════════════ */

function getBloqueActual(): string {
  const h = new Date().getHours();
  if (h >= 8 && h < 12) return 'despertar';
  if (h >= 12 && h < 18) return 'nutricion';
  return 'cierre';
}

function fmtTime(seg: number) {
  const m = Math.floor(seg / 60); const s = seg % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}`;
}

const CIRCLE_CFG: Record<string, { bg: string; ring: string; anim: string; label: string }> = {
  inhalar:     { bg: 'bg-blue-500',    ring: 'bg-blue-300',    anim: 'animate-breathe-in',   label: 'INHALE' },
  exhalar:     { bg: 'bg-emerald-500', ring: 'bg-emerald-300', anim: 'animate-breathe-out',  label: 'EXHALE' },
  mantener:    { bg: 'bg-amber-400',   ring: 'bg-amber-200',   anim: 'animate-breathe-hold', label: 'MANTENGA' },
  descanso:    { bg: 'bg-slate-400',   ring: 'bg-slate-200',   anim: '',                     label: 'DESCANSO' },
  activo:      { bg: 'bg-purple-500',  ring: 'bg-purple-300',  anim: '',                     label: 'EJERCICIO' },
  preparacion: { bg: 'bg-gray-400',    ring: 'bg-gray-200',    anim: '',                     label: 'PREPARACIÓN' },
  alerta:      { bg: 'bg-red-500',     ring: 'bg-red-300',     anim: '',                     label: '⚠️ ATENCIÓN' },
};

/* ════════════════════════════════════════════════════════════════════════════
   COMPONENTE
   ════════════════════════════════════════════════════════════════════════════ */

export default function ProtocoloPage() {
  /* ── state ── */
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [expandedGuia, setExpandedGuia] = useState<string | null>(null);
  const [openBlocks, setOpenBlocks] = useState<Record<string, boolean>>({});

  /* ── modal ejercicio ── */
  const [modalEjId, setModalEjId] = useState<string | null>(null);
  const [modalTareaId, setModalTareaId] = useState<string | null>(null);
  const [pasoIdx, setPasoIdx] = useState(0);
  const [seg, setSeg] = useState(0);
  const [enCurso, setEnCurso] = useState(false);
  const [completado, setCompletado] = useState(false);

  /* ── modal signos vitales ── */
  const [showSignos, setShowSignos] = useState(false);
  const [signosTareaId, setSignosTareaId] = useState<string | null>(null);
  const [signosOk, setSignosOk] = useState(false);
  const [saturacion, setSaturacion] = useState(0);
  const [pulso, setPulso] = useState(0);
  const [presionSis, setPresionSis] = useState(0);
  const [presionDia, setPresionDia] = useState(0);
  const [peso, setPeso] = useState(0);

  /* ── modal síntomas ── */
  const [showSintomas, setShowSintomas] = useState(false);
  const [sintomas, setSintomas] = useState<Record<string, boolean>>({});
  const [energia, setEnergia] = useState(5);
  const [sintomasOk, setSintomasOk] = useState(false);
  const [sintomasTareaId, setSintomasTareaId] = useState<string | null>(null);

  /* ── audio ── */
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioInitRef = useRef(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  /* ── init ── */
  useEffect(() => {
    setChecks(getChecks());
    setSintomas(getSintomas());
    setOpenBlocks({ [getBloqueActual()]: true });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const ld = () => { voicesRef.current = window.speechSynthesis.getVoices(); };
    ld(); window.speechSynthesis.addEventListener('voiceschanged', ld);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', ld);
  }, []);

  /* ── audio fns ── */
  const initAudio = async () => {
    if (audioInitRef.current) return;
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    audioCtxRef.current = new AC();
    try { await audioCtxRef.current?.resume(); } catch {}
    audioInitRef.current = true;
  };

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, '').replace(/\s+/g, ' ').trim();
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = 'es-ES'; u.rate = 0.85; u.pitch = 0.9; u.volume = 0.9;
      const vv = voicesRef.current || [];
      const best = vv.find(v => v.lang?.startsWith('es') && /google|sofia|lucia|maria|mónica|monica/i.test(v.name)) || vv.find(v => v.lang?.startsWith('es')) || vv[0];
      if (best) u.voice = best;
      window.speechSynthesis.speak(u);
    } catch {}
  }, []);

  const stopSpeak = () => { try { window.speechSynthesis.cancel(); } catch {} };

  const playTick = useCallback(() => {
    const ctx = audioCtxRef.current; if (!ctx) return;
    const now = ctx.currentTime; const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'square'; o.frequency.value = 1000;
    g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.2, now + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    o.connect(g); g.connect(ctx.destination); o.start(now); o.stop(now + 0.13);
  }, []);

  const playInhale = useCallback((dur = 0.8) => {
    const ctx = audioCtxRef.current; if (!ctx) return;
    const now = ctx.currentTime; const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(350, now); o.frequency.linearRampToValueAtTime(900, now + dur);
    g.gain.setValueAtTime(0.001, now); g.gain.linearRampToValueAtTime(0.12, now + dur * 0.6); g.gain.linearRampToValueAtTime(0.02, now + dur);
    o.connect(g); g.connect(ctx.destination); o.start(now); o.stop(now + dur + 0.05);
  }, []);

  const playExhale = useCallback((dur = 0.8) => {
    const ctx = audioCtxRef.current; if (!ctx) return;
    const now = ctx.currentTime; const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(900, now); o.frequency.linearRampToValueAtTime(350, now + dur);
    g.gain.setValueAtTime(0.001, now); g.gain.linearRampToValueAtTime(0.12, now + dur * 0.4); g.gain.linearRampToValueAtTime(0.01, now + dur);
    o.connect(g); g.connect(ctx.destination); o.start(now); o.stop(now + dur + 0.05);
  }, []);

  /* ── wake lock ── */
  const acquireWake = async () => {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    try { wakeLockRef.current = await (navigator as any).wakeLock.request('screen'); } catch {}
  };
  const releaseWake = () => { wakeLockRef.current?.release().catch(() => {}); wakeLockRef.current = null; };

  /* ── checks ── */
  const toggleCheck = useCallback((id: string) => {
    setChecks(p => { const n = { ...p, [id]: !p[id] }; saveChecks(n); return n; });
  }, []);

  const markDone = useCallback((id: string) => {
    setChecks(p => { const n = { ...p, [id]: true }; saveChecks(n); return n; });
  }, []);

  const toggleBlock = useCallback((id: string) => {
    setOpenBlocks(p => ({ ...p, [id]: !p[id] }));
  }, []);

  /* ── guardar signos vitales ── */
  const guardarSignos = useCallback(async () => {
    try {
      await guardarRegistro({
        fecha: fechaHoy(),
        tipo: 'cardiorrenal',
        datos: { saturacion, pulso, presionSis, presionDia, peso, tipoRegistro: 'signos-protocolo' },
        timestamp: Date.now(),
      });
    } catch {}
    setSignosOk(true);
    if (signosTareaId) markDone(signosTareaId);
  }, [saturacion, pulso, presionSis, presionDia, peso, signosTareaId, markDone]);

  /* ── abrir ejercicio ── */
  const abrirEjercicio = useCallback((ejId: string, tareaId: string) => {
    if (ejId === 'control-signos') {
      setSignosTareaId(tareaId);
      setSignosOk(false);
      setShowSignos(true);
      return;
    }
    if (ejId === 'registro-sintomas') {
      setSintomasTareaId(tareaId);
      setSintomasOk(false);
      setShowSintomas(true);
      return;
    }
    setModalEjId(ejId);
    setModalTareaId(tareaId);
    setPasoIdx(0);
    const ej = EJERCICIOS[ejId];
    if (ej) setSeg(ej.pasos[0].duracion);
    setEnCurso(false);
    setCompletado(false);
  }, []);

  const cerrarModal = useCallback(() => {
    releaseWake(); stopSpeak();
    setModalEjId(null); setModalTareaId(null);
    setEnCurso(false); setCompletado(false);
  }, []);

  /* ── datos ejercicio ── */
  const ejData = modalEjId ? EJERCICIOS[modalEjId] : null;
  const pasos = ejData?.pasos || [];
  const paso = pasos[pasoIdx];

  /* ── timer ── */
  useEffect(() => {
    if (!modalEjId || !enCurso || completado) return;
    const timer = setInterval(() => {
      playTick();
      setSeg(prev => {
        if (prev <= 1) {
          const sig = pasoIdx + 1;
          if (sig >= pasos.length) {
            setCompletado(true); setEnCurso(false); releaseWake();
            return 0;
          }
          setPasoIdx(sig);
          return pasos[sig].duracion;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [modalEjId, enCurso, completado, pasoIdx, pasos, playTick]);

  /* ── sonido + TTS por paso ── */
  useEffect(() => {
    if (!paso || !enCurso || !audioInitRef.current) return;
    if (paso.tipo === 'inhalar') playInhale(Math.min(paso.duracion, 3));
    else if (paso.tipo === 'exhalar') playExhale(Math.min(paso.duracion, 3));
    else if (paso.tipo === 'mantener') playTick();
    speak(paso.instruccion);
  }, [pasoIdx, enCurso, speak, playInhale, playExhale, playTick]);

  /* ── al completar ── */
  useEffect(() => {
    if (!completado || !modalEjId) return;
    try { playInhale(0.3); playExhale(0.6); } catch {}
    speak('¡Ejercicio completado! Muy bien hecho.');
    if (modalTareaId) markDone(modalTareaId);
  }, [completado, modalEjId, modalTareaId, markDone, speak, playInhale, playExhale]);

  /* ── guardar síntomas ── */
  const guardarSintomas = useCallback(async () => {
    saveSintomas(sintomas);
    try {
      await guardarRegistro({
        fecha: fechaHoy(),
        tipo: 'mental',
        datos: { ...sintomas, energia, tipoRegistro: 'sintomas-protocolo' },
        timestamp: Date.now(),
      });
    } catch {}
    setSintomasOk(true);
    if (sintomasTareaId) markDone(sintomasTareaId);
  }, [sintomas, energia, sintomasTareaId, markDone]);

  /* ── cálculos ── */
  const totalTareas = PROTOCOLO.reduce((a, b) => a + b.tareas.length, 0);
  const tareasHechas = PROTOCOLO.reduce((a, b) => a + b.tareas.filter(t => checks[t.id]).length, 0);
  const progreso = totalTareas > 0 ? Math.round((tareasHechas / totalTareas) * 100) : 0;
  const progEj = pasos.length > 0 ? Math.round(((pasoIdx + 1) / pasos.length) * 100) : 0;
  const cc = paso ? (CIRCLE_CFG[paso.tipo] || CIRCLE_CFG.descanso) : CIRCLE_CFG.descanso;

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════════════════ */

  return (
    <>
      <Header titulo="📋 Mi Protocolo Diario" />

      {/* ══════════ MODAL EJERCICIO GUIADO ══════════ */}
      {modalEjId && ejData && (
        <div className="fixed inset-x-0 top-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] z-[60] bg-gray-50 flex flex-col overflow-auto">
          <div className="bg-green-600 text-white px-4 py-3 flex items-center gap-3 shrink-0">
            <button onClick={cerrarModal} className="text-2xl p-1 hover:bg-green-700 rounded-lg" aria-label="Cerrar">✕</button>
            <h2 className="text-lg font-bold flex-1 truncate">{ejData.nombre}</h2>
          </div>

          <div className="flex-1 px-4 py-4 space-y-4 max-w-3xl mx-auto w-full">

            {/* PRE-INICIO */}
            {!enCurso && !completado && paso && (
              <>
                <div className={`phase-panel phase-panel--${paso.tipo} animate-float-up`}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2 text-gray-500">{cc.label}</p>
                  <p className="text-xl font-bold text-gray-800 leading-relaxed">{paso.instruccion}</p>
                </div>
                <Button fullWidth onClick={async () => {
                  await initAudio();
                  try { ensureAudioUnlocked(); } catch {}
                  setPasoIdx(0); setSeg(pasos[0].duracion);
                  setEnCurso(true); acquireWake();
                }}>
                  ▶️ Iniciar Ejercicio
                </Button>
                <Button fullWidth variant="ghost" onClick={cerrarModal}>← Volver al protocolo</Button>
              </>
            )}

            {/* EN CURSO */}
            {enCurso && !completado && paso && (
              <>
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Paso {pasoIdx + 1} de {pasos.length}</span>
                    <span>{progEj}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{
                      width: `${progEj}%`,
                      background: paso.tipo === 'inhalar' ? '#3b82f6' : paso.tipo === 'exhalar' ? '#10b981' : paso.tipo === 'mantener' ? '#f59e0b' : paso.tipo === 'activo' ? '#8b5cf6' : '#94a3b8',
                    }} />
                  </div>
                </div>

                <div className={`phase-panel phase-panel--${paso.tipo} animate-float-up`}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{
                    color: paso.tipo === 'inhalar' ? '#1d4ed8' : paso.tipo === 'exhalar' ? '#15803d' : paso.tipo === 'mantener' ? '#92400e' : paso.tipo === 'activo' ? '#6d28d9' : '#475569',
                  }}>{cc.label}</p>
                  <p className="text-xl font-bold text-gray-800 leading-relaxed">{paso.instruccion}</p>
                </div>

                <div className="flex justify-center py-4">
                  <div className="breath-circle w-44 h-44">
                    <div className={`breath-circle__ring ${cc.ring} opacity-50 animate-pulse-ring-slow`} />
                    <div className={`breath-circle__ring ${cc.ring} opacity-60 animate-pulse-ring`} />
                    <div className={`w-44 h-44 rounded-full flex flex-col items-center justify-center shadow-2xl z-10 relative ${cc.bg} ${cc.anim}`}>
                      <span className="text-5xl font-black text-white tabular-nums leading-none">{fmtTime(seg)}</span>
                      <span className="text-white/80 text-sm font-semibold mt-1">seg</span>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border-2 border-red-300 rounded-xl p-3 flex items-center gap-2">
                  <span className="text-xl">🚨</span>
                  <p className="text-sm text-red-700 font-medium">Si la saturación baja de 88%, DETÉNGASE.</p>
                </div>

                <button
                  className="w-full py-4 rounded-2xl border-2 border-red-200 bg-red-50 text-red-600 font-bold text-base active:scale-95 transition-all hover:bg-red-100"
                  onClick={() => { releaseWake(); stopSpeak(); setEnCurso(false); setCompletado(false); cerrarModal(); }}
                >
                  ✕ Detener ejercicio
                </button>
              </>
            )}

            {/* COMPLETADO */}
            {completado && (
              <>
                <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                  className="rounded-3xl p-8 shadow-xl text-center">
                  <div className="text-7xl mb-4">🎉</div>
                  <h2 className="text-white text-2xl font-black mb-2">¡Ejercicio completado!</h2>
                  <p className="text-emerald-100 text-base">{ejData.nombre}<br /><strong className="text-white">¡Excelente trabajo!</strong></p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex justify-center gap-8">
                  <div className="text-center">
                    <p className="text-3xl font-black text-emerald-600">{pasos.length}</p>
                    <p className="text-gray-500 text-xs mt-0.5">pasos</p>
                  </div>
                  <div className="w-px bg-gray-200" />
                  <div className="text-center">
                    <p className="text-3xl font-black text-blue-500">✓</p>
                    <p className="text-gray-500 text-xs mt-0.5">completado</p>
                  </div>
                </div>
                <Button fullWidth onClick={cerrarModal}>← Volver al protocolo</Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════ MODAL CONTROL DE SIGNOS VITALES ══════════ */}
      {showSignos && (
        <div className="fixed inset-x-0 top-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] z-[60] bg-gray-50 flex flex-col overflow-auto">
          <div className="bg-green-600 text-white px-4 py-3 flex items-center gap-3 shrink-0">
            <button onClick={() => setShowSignos(false)} className="text-2xl p-1 hover:bg-green-700 rounded-lg" aria-label="Cerrar">✕</button>
            <h2 className="text-lg font-bold flex-1">📋 Control de Signos Vitales</h2>
          </div>

          <div className="flex-1 px-4 py-4 space-y-4 max-w-3xl mx-auto w-full">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
              <p className="text-base text-blue-800 font-medium">Ponga el oxímetro en el dedo y anote sus signos. Use el brazalete para la presión.</p>
            </div>

            <div className="bg-white rounded-xl border-2 border-gray-200 p-4 space-y-5">
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">🫁 Saturación de oxígeno (%)</label>
                <input type="number" inputMode="numeric" value={saturacion || ''} onChange={e => setSaturacion(Number(e.target.value))} placeholder="Ej: 92" min={50} max={100}
                  className="w-full text-center text-3xl font-bold py-4 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none bg-white text-gray-800" />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">💓 Pulso (latidos/min)</label>
                <input type="number" inputMode="numeric" value={pulso || ''} onChange={e => setPulso(Number(e.target.value))} placeholder="Ej: 72" min={30} max={200}
                  className="w-full text-center text-3xl font-bold py-4 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none bg-white text-gray-800" />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">🩸 Presión Arterial</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1 text-center">Sistólica (alta)</p>
                    <input type="number" inputMode="numeric" value={presionSis || ''} onChange={e => setPresionSis(Number(e.target.value))} placeholder="120" min={60} max={250}
                      className="w-full text-center text-2xl font-bold py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none bg-white text-gray-800" />
                  </div>
                  <span className="text-3xl font-bold text-gray-400 mt-5">/</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1 text-center">Diastólica (baja)</p>
                    <input type="number" inputMode="numeric" value={presionDia || ''} onChange={e => setPresionDia(Number(e.target.value))} placeholder="80" min={30} max={150}
                      className="w-full text-center text-2xl font-bold py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none bg-white text-gray-800" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">⚖️ Peso (kg)</label>
                <input type="number" inputMode="decimal" value={peso || ''} onChange={e => setPeso(Number(e.target.value))} placeholder="Ej: 65.5" min={20} max={200} step={0.1}
                  className="w-full text-center text-3xl font-bold py-4 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none bg-white text-gray-800" />
              </div>
            </div>

            {saturacion > 0 && saturacion < 88 && (
              <div className="bg-red-600 text-white rounded-2xl p-4 flex items-center gap-3">
                <span className="text-3xl">🚨</span>
                <p className="text-lg font-bold">¡ALERTA! Saturación menor a 88%. Suba el oxígeno y llame al médico.</p>
              </div>
            )}

            {signosOk ? (
              <div className="bg-green-100 border-2 border-green-400 rounded-2xl p-5 text-center">
                <span className="text-4xl">✅</span>
                <p className="text-lg font-bold text-green-800 mt-2">Signos vitales guardados correctamente</p>
              </div>
            ) : (
              <Button fullWidth onClick={guardarSignos}>💾 Guardar Signos Vitales</Button>
            )}

            <Button fullWidth variant="ghost" onClick={() => setShowSignos(false)}>← Volver al protocolo</Button>
            <div className="h-4" />
          </div>
        </div>
      )}

      {/* ══════════ MODAL REGISTRO DE SÍNTOMAS ══════════ */}
      {showSintomas && (
        <div className="fixed inset-x-0 top-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] z-[60] bg-gray-50 flex flex-col overflow-auto">
          <div className="bg-green-600 text-white px-4 py-3 flex items-center gap-3 shrink-0">
            <button onClick={() => setShowSintomas(false)} className="text-2xl p-1 hover:bg-green-700 rounded-lg" aria-label="Cerrar">✕</button>
            <h2 className="text-lg font-bold flex-1">📝 Registro de Síntomas</h2>
          </div>

          <div className="flex-1 px-4 py-4 space-y-4 max-w-3xl mx-auto w-full">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
              <p className="text-base text-blue-800 font-medium">Responda cada pregunta tocando Sí o No. Esto ayuda al médico a seguir su progreso.</p>
            </div>

            <div className="space-y-3">
              {PREGUNTAS_SINTOMAS.map(p => {
                const val = sintomas[p.id];
                return (
                  <div key={p.id} className="bg-white rounded-xl border-2 border-gray-200 p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl shrink-0">{p.icono}</span>
                      <p className="text-base font-medium text-gray-800 flex-1">{p.texto}</p>
                    </div>
                    <div className="flex gap-3 mt-3 ml-9">
                      <button onClick={() => setSintomas(pr => ({ ...pr, [p.id]: true }))}
                        className={`flex-1 py-3 rounded-xl font-bold text-lg border-2 transition-colors ${val === true ? 'bg-red-100 border-red-400 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                        Sí
                      </button>
                      <button onClick={() => setSintomas(pr => ({ ...pr, [p.id]: false }))}
                        className={`flex-1 py-3 rounded-xl font-bold text-lg border-2 transition-colors ${val === false ? 'bg-green-100 border-green-400 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                        No
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
              <SliderInput label="Del 1 al 10, ¿cuánta energía tuvo hoy?" value={energia} onChange={setEnergia} min={1} max={10} />
              <div className="flex justify-between text-sm text-gray-400 mt-1">
                <span>😴 Muy baja</span>
                <span>⚡ Mucha energía</span>
              </div>
            </div>

            {sintomasOk ? (
              <div className="bg-green-100 border-2 border-green-400 rounded-2xl p-5 text-center">
                <span className="text-4xl">✅</span>
                <p className="text-lg font-bold text-green-800 mt-2">Registro guardado correctamente</p>
              </div>
            ) : (
              <Button fullWidth onClick={guardarSintomas}>💾 Guardar Registro</Button>
            )}

            <Button fullWidth variant="ghost" onClick={() => setShowSintomas(false)}>← Volver al protocolo</Button>
            <div className="h-4" />
          </div>
        </div>
      )}

      {/* ══════════ CONTENIDO PRINCIPAL ══════════ */}
      <div className="lg:flex lg:gap-6 lg:p-6">
        {/* Dashboard solo PC (columna derecha en orden visual, pero primero en DOM para aside) */}
        <aside className="hidden lg:block lg:w-80 xl:w-96 shrink-0 lg:order-2">
          <div className="sticky top-6">
            <DashboardPC />
          </div>
        </aside>

        {/* Protocolo (columna izquierda) */}
        <div className="flex-1 min-w-0 p-4 lg:p-0 space-y-4 lg:order-1">
        {/* Alerta de seguridad */}
        <div className="bg-red-600 text-white rounded-2xl p-5 shadow-lg border-2 border-red-700">
          <div className="flex items-start gap-3">
            <span className="text-4xl shrink-0">🚨</span>
            <div>
              <h2 className="text-xl font-black">REGLA DE SEGURIDAD</h2>
              <p className="text-lg mt-1 font-semibold leading-snug">
                Si la saturación baja de <span className="text-yellow-300 text-2xl font-black">88%</span>, PARE toda actividad, siéntese y suba el oxígeno.
              </p>
            </div>
          </div>
        </div>

        {/* Progreso */}
        <div className="bg-white rounded-2xl p-5 border-2 border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Círculo de progreso */}
            <div className="relative w-20 h-20 shrink-0">
              <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#22c55e" strokeWidth="3"
                  strokeDasharray={`${progreso} ${100 - progreso}`} strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 0.5s ease' }} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-black text-green-600">{progreso}%</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-800">📊 Progreso de Hoy</h2>
              <p className="text-gray-500 text-base mt-0.5">{tareasHechas} de {totalTareas} actividades</p>
              <p className="text-base font-semibold mt-1 text-green-700">
                {progreso === 100 ? '🎉 ¡Protocolo completado!' : progreso >= 70 ? '💪 ¡Excelente, casi terminas!' : progreso >= 30 ? '⭐ ¡Vas muy bien, sigue así!' : progreso > 0 ? '✨ ¡Buen comienzo!' : '☀️ ¡A empezar el día!'}
              </p>
            </div>
          </div>
          <div className="bg-gray-200 rounded-full h-3 overflow-hidden mt-4">
            <div className="bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full transition-all duration-500" style={{ width: `${progreso}%` }} />
          </div>
        </div>

        {/* Bloques */}
        {PROTOCOLO.map(bloque => {
          const isOpen = openBlocks[bloque.id] ?? false;
          const nTareas = bloque.tareas.length;
          const nHechas = bloque.tareas.filter(t => checks[t.id]).length;
          const esActual = bloque.id === getBloqueActual();

          return (
            <div key={bloque.id} className={`rounded-2xl border-2 overflow-hidden shadow-sm ${bloque.borderColor} ${bloque.color}`}>
              <button onClick={() => toggleBlock(bloque.id)} className={`w-full flex items-center justify-between p-5 text-left ${bloque.color}`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{bloque.icono}</span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{bloque.nombre}</h2>
                    <p className="text-base text-gray-500">{bloque.rango}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {esActual && <span className="bg-green-600 text-white text-sm font-bold px-3 py-1 rounded-full">AHORA</span>}
                  <span className="text-base font-bold text-gray-600">{nHechas}/{nTareas}</span>
                  <span className="text-2xl text-gray-400">{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 space-y-3">
                  {bloque.tareas.map(tarea => {
                    const done = checks[tarea.id] ?? false;
                    const isExp = expandedTask === tarea.id;
                    const tieneEj = !!tarea.ejercicioId;

                    return (
                      <div key={tarea.id} className={`bg-white rounded-xl border-2 overflow-hidden transition-all ${done ? 'border-green-400 opacity-80' : 'border-gray-200'}`}>
                        <div className="flex items-start gap-3 p-4">
                          <button onClick={() => toggleCheck(tarea.id)}
                            className={`shrink-0 w-12 h-12 rounded-xl border-3 flex items-center justify-center text-2xl transition-colors ${done ? 'bg-green-500 border-green-600 text-white' : 'bg-white border-gray-300 text-gray-300 hover:border-green-400'}`}
                            aria-label={done ? 'Desmarcar' : 'Marcar como hecho'}>
                            {done ? '✓' : ''}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-2xl font-black text-green-700 tabular-nums">{tarea.hora}</span>
                              <span className="text-xl">{ICONOS_TIPO[tarea.tipo]}</span>
                            </div>
                            <h3 className={`text-lg font-bold mt-1 ${done ? 'line-through text-gray-400' : 'text-gray-800'}`}>{tarea.titulo}</h3>
                            <p className={`text-base mt-1 leading-snug ${done ? 'text-gray-400' : 'text-gray-600'}`}>{tarea.descripcion}</p>

                            {tarea.medicamentos && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {tarea.medicamentos.map(med => (
                                  <span key={med} className="inline-block bg-amber-100 text-amber-800 text-sm font-semibold px-3 py-1 rounded-full border border-amber-300">💊 {med}</span>
                                ))}
                              </div>
                            )}

                            {/* Botón de ejercicio guiado */}
                            {tieneEj && (
                              <button onClick={() => abrirEjercicio(tarea.ejercicioId!, tarea.id)}
                                className={`mt-3 w-full py-3 rounded-xl font-bold text-base border-2 transition-all active:scale-95 ${done ? 'bg-green-50 border-green-300 text-green-600' : 'bg-green-600 border-green-700 text-white hover:bg-green-700'}`}>
                                {tarea.ejercicioId === 'registro-sintomas'
                                  ? (done ? '✅ Completado — Ver de nuevo' : '📝 Abrir Registro de Síntomas')
                                  : tarea.ejercicioId === 'control-signos'
                                  ? (done ? '✅ Completado — Ver de nuevo' : '📋 Anotar Signos Vitales')
                                  : (done ? '✅ Completado — Repetir' : '▶️ Iniciar Ejercicio Guiado')
                                }
                              </button>
                            )}

                            {/* Instrucciones de texto (solo si NO es ejercicio guiado) */}
                            {!tieneEj && tarea.detalle && (
                              <>
                                <button onClick={() => setExpandedTask(isExp ? null : tarea.id)} className="mt-2 text-blue-600 font-semibold text-base hover:underline">
                                  {isExp ? '▲ Ocultar instrucciones' : '▶ Ver instrucciones'}
                                </button>
                                {isExp && (
                                  <div className="bg-blue-50 border-t-2 border-blue-200 p-4 mt-3 rounded-xl">
                                    <p className="text-base text-gray-700 whitespace-pre-line leading-relaxed">{tarea.detalle}</p>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Guías extra */}
        <div className="pt-2">
          <h2 className="text-xl font-bold text-gray-800 px-1 mb-3">📚 Guías de Ayuda</h2>
          <div className="space-y-3">
            {GUIAS.map(guia => {
              const isO = expandedGuia === guia.id;
              return (
                <div key={guia.id} className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm overflow-hidden">
                  <button onClick={() => setExpandedGuia(isO ? null : guia.id)} className="w-full flex items-center gap-3 p-4 text-left">
                    <span className="text-3xl">{guia.icono}</span>
                    <span className="text-lg font-bold text-gray-800 flex-1">{guia.titulo}</span>
                    <span className="text-xl text-gray-400">{isO ? '▲' : '▼'}</span>
                  </button>
                  {isO && (
                    <div className="px-5 pb-5">
                      <p className="text-base text-gray-700 whitespace-pre-line leading-relaxed">{guia.contenido}</p>
                      {guia.ejercicioId && (
                        <button onClick={() => { setExpandedGuia(null); abrirEjercicio(guia.ejercicioId!, ''); }}
                          className="mt-4 w-full py-3 rounded-xl font-bold text-base border-2 bg-green-600 border-green-700 text-white hover:bg-green-700 active:scale-95 transition-all">
                          ▶️ Practicar ahora
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="h-4" />
      </div>
      </div>
    </>
  );
}
