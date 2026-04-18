'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { guardarRegistro, fechaHoy } from '@/lib/db';

/* ════════════════════════════════════════════════════════════════════════════
   TIPOS
   ════════════════════════════════════════════════════════════════════════════ */

type TipoPaso = 'inhalar' | 'exhalar' | 'mantener' | 'descanso' | 'activo' | 'preparacion' | 'alerta';
type CategoriaEjercicio = 'respiratorio' | 'aparatos' | 'movilidad';
type SeccionVista = 'plan' | 'biblioteca';

interface PasoGuiado {
  instruccion: string;
  duracion: number;
  tipo: TipoPaso;
}

interface Ejercicio {
  id: string;
  nombre: string;
  icono: string;
  categoria: CategoriaEjercicio;
  beneficio: string;
  duracionMin: number;
  dificultad: 'Fácil' | 'Moderado';
  requiereAparato?: string;
  descripcionCorta: string;
  instruccionesEstaticas?: { titulo: string; pasos: string[] }[];
  advertencias?: string[];
  pasos?: PasoGuiado[];
}

/* ════════════════════════════════════════════════════════════════════════════
   DATOS — PASOS GUIADOS
   ════════════════════════════════════════════════════════════════════════════ */

const PASOS_DORADA: PasoGuiado[] = [
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

const PASOS_DIAFRAGMATICO: PasoGuiado[] = [
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

const PASOS_HUFFING: PasoGuiado[] = [
  { instruccion: 'Siéntese derecha, con los pies bien apoyados y el oxígeno puesto', duracion: 6, tipo: 'descanso' },
  { instruccion: '🫁 INHALE profundo y tranquilo por la nariz...', duracion: 4, tipo: 'inhalar' },
  { instruccion: '⏸️ Mantenga el aire...', duracion: 3, tipo: 'mantener' },
  { instruccion: '💨 HUFF 1 — Boca abierta: "Jaaaaff" (como empañar un vidrio)', duracion: 3, tipo: 'exhalar' },
  { instruccion: '💨 HUFF 2 — Repita: "Jaaaaff"', duracion: 3, tipo: 'exhalar' },
  { instruccion: '✨ Descanse... respire con normalidad unos segundos', duracion: 6, tipo: 'descanso' },
  { instruccion: '🫁 INHALE profundo y tranquilo por la nariz...', duracion: 4, tipo: 'inhalar' },
  { instruccion: '⏸️ Mantenga el aire 2-3 segundos...', duracion: 3, tipo: 'mantener' },
  { instruccion: '💨 HUFF 1 — Boca abierta: "Jaaaaff"', duracion: 3, tipo: 'exhalar' },
  { instruccion: '💨 HUFF 2 — Repita: "Jaaaaff"', duracion: 3, tipo: 'exhalar' },
  { instruccion: '✨ Descanse... respire con calma', duracion: 6, tipo: 'descanso' },
  { instruccion: '🫁 INHALE profundo y tranquilo... último ciclo', duracion: 4, tipo: 'inhalar' },
  { instruccion: '⏸️ Mantenga el aire...', duracion: 3, tipo: 'mantener' },
  { instruccion: '💨 HUFF 1 — Boca abierta: "Jaaaaff"', duracion: 3, tipo: 'exhalar' },
  { instruccion: '💨 HUFF 2 — Último huff: "Jaaaaff"', duracion: 3, tipo: 'exhalar' },
  { instruccion: '✅ ¡Excelente! Ha completado la limpieza bronquial', duracion: 5, tipo: 'descanso' },
];

const PASOS_LABIOS: PasoGuiado[] = [
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

const PASOS_SILLA: PasoGuiado[] = [
  { instruccion: 'Siéntese en una silla firme con la espalda bien apoyada', duracion: 6, tipo: 'preparacion' },
  { instruccion: 'Pies planos en el suelo, manos en los muslos', duracion: 5, tipo: 'preparacion' },
  { instruccion: '🛑 Si siente mareo o falta de aire, deténgase y descanse', duracion: 5, tipo: 'alerta' },
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
  { instruccion: '💪 Haga círculos con los hombros hacia ATRÁS. Lento y suave.', duracion: 10, tipo: 'activo' },
  { instruccion: '💪 Ahora círculos hacia ADELANTE. Lento y suave.', duracion: 10, tipo: 'activo' },
  { instruccion: '✅ ¡Ejercicio completado! Descanse tranquila.', duracion: 6, tipo: 'descanso' },
];

const PASOS_CAMINATA: PasoGuiado[] = [
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

const PASOS_ACAPELLA: PasoGuiado[] = [
  { instruccion: 'Prepare el dispositivo Acapella Choice.', duracion: 6, tipo: 'preparacion' },
  { instruccion: 'Siéntese erguida con los codos apoyados sobre una mesa. Espalda recta, hombros relajados.', duracion: 8, tipo: 'preparacion' },
  { instruccion: 'Tenga el oxígeno puesto. Si siente mareos en cualquier momento, deténgase de inmediato.', duracion: 7, tipo: 'alerta' },
  { instruccion: 'Ciclo 1 de 10. INHALE profundo por la nariz, fuera del dispositivo.', duracion: 4, tipo: 'inhalar' },
  { instruccion: 'Retenga el aire 2-3 segundos...', duracion: 3, tipo: 'mantener' },
  { instruccion: 'Coloque la boquilla y EXHALE lento y constante por el Acapella. Sienta la vibración en el pecho.', duracion: 7, tipo: 'exhalar' },
  { instruccion: 'Ciclo 2 de 10. INHALE profundo por la nariz.', duracion: 4, tipo: 'inhalar' },
  { instruccion: 'Retenga...', duracion: 3, tipo: 'mantener' },
  { instruccion: 'EXHALE lento y constante. No brusco. Sienta la vibración.', duracion: 7, tipo: 'exhalar' },
  { instruccion: 'Ciclo 3 de 10. INHALE profundo.', duracion: 4, tipo: 'inhalar' },
  { instruccion: 'Retenga...', duracion: 3, tipo: 'mantener' },
  { instruccion: 'EXHALE por el Acapella, constante y suave.', duracion: 7, tipo: 'exhalar' },
  { instruccion: 'Ciclo 4 de 10. INHALE.', duracion: 4, tipo: 'inhalar' },
  { instruccion: 'Retenga...', duracion: 3, tipo: 'mantener' },
  { instruccion: 'EXHALE con calma. Sienta la vibración.', duracion: 7, tipo: 'exhalar' },
  { instruccion: 'Ciclo 5 de 10. INHALE profundo.', duracion: 4, tipo: 'inhalar' },
  { instruccion: 'Retenga...', duracion: 3, tipo: 'mantener' },
  { instruccion: 'EXHALE constante. Va muy bien.', duracion: 7, tipo: 'exhalar' },
  { instruccion: 'Pausa. Retire el dispositivo y respire 2-3 veces con normalidad.', duracion: 12, tipo: 'descanso' },
  { instruccion: 'Ciclo 6 de 10. INHALE profundo.', duracion: 4, tipo: 'inhalar' },
  { instruccion: 'Retenga...', duracion: 3, tipo: 'mantener' },
  { instruccion: 'EXHALE por el Acapella, lento y constante.', duracion: 7, tipo: 'exhalar' },
  { instruccion: 'Ciclo 7 de 10. INHALE profundo.', duracion: 4, tipo: 'inhalar' },
  { instruccion: 'Retenga...', duracion: 3, tipo: 'mantener' },
  { instruccion: 'EXHALE. Sienta la vibración en el pecho.', duracion: 7, tipo: 'exhalar' },
  { instruccion: 'Ciclo 8 de 10. INHALE.', duracion: 4, tipo: 'inhalar' },
  { instruccion: 'Retenga...', duracion: 3, tipo: 'mantener' },
  { instruccion: 'EXHALE constante. Casi terminamos.', duracion: 7, tipo: 'exhalar' },
  { instruccion: 'Ciclo 9 de 10. INHALE profundo.', duracion: 4, tipo: 'inhalar' },
  { instruccion: 'Retenga...', duracion: 3, tipo: 'mantener' },
  { instruccion: 'EXHALE suave y constante.', duracion: 7, tipo: 'exhalar' },
  { instruccion: 'Último ciclo, 10 de 10. INHALE profundo.', duracion: 4, tipo: 'inhalar' },
  { instruccion: 'Retenga el aire...', duracion: 3, tipo: 'mantener' },
  { instruccion: 'EXHALE por el Acapella por última vez. Constante y suave.', duracion: 7, tipo: 'exhalar' },
  { instruccion: 'Muy bien. Descanse. Respire normalmente unos segundos.', duracion: 10, tipo: 'descanso' },
  { instruccion: 'Ahora la tos dirigida. INHALE profundo por la nariz.', duracion: 4, tipo: 'inhalar' },
  { instruccion: 'Retenga el aire...', duracion: 3, tipo: 'mantener' },
  { instruccion: 'TOS DIRIGIDA 1: boca bien abierta, exhale con fuerza "Jaaaaff", como empañar un vidrio.', duracion: 4, tipo: 'exhalar' },
  { instruccion: 'INHALE de nuevo profundo.', duracion: 4, tipo: 'inhalar' },
  { instruccion: 'Retenga...', duracion: 3, tipo: 'mantener' },
  { instruccion: 'TOS DIRIGIDA 2: "Jaaaaff". Expulse las secreciones.', duracion: 4, tipo: 'exhalar' },
  { instruccion: 'Sesión completada. Respire con calma y descanse.', duracion: 6, tipo: 'descanso' },
];

const PASOS_TRIFLO: PasoGuiado[] = [
  { instruccion: 'Sostenga el Triflo en posición vertical.', duracion: 6, tipo: 'preparacion' },
  { instruccion: 'Si siente mareos, descanse de inmediato. No más de 10 repeticiones seguidas sin pausa.', duracion: 7, tipo: 'alerta' },
  { instruccion: 'Repetición 1 de 8. Exhale todo el aire fuera del aparato, vaciando bien los pulmones.', duracion: 5, tipo: 'exhalar' },
  { instruccion: 'Coloque la boquilla y selle bien los labios.', duracion: 3, tipo: 'preparacion' },
  { instruccion: 'INHALE lento y constante por el Triflo. Mantenga las bolas elevadas el mayor tiempo posible.', duracion: 7, tipo: 'inhalar' },
  { instruccion: 'Mantenga la inspiración unos segundos...', duracion: 3, tipo: 'mantener' },
  { instruccion: 'Suelte lentamente. Respire 2 veces con normalidad.', duracion: 7, tipo: 'descanso' },
  { instruccion: 'Repetición 2 de 8. Exhale TODO el aire fuera del aparato.', duracion: 5, tipo: 'exhalar' },
  { instruccion: 'Coloque la boquilla.', duracion: 2, tipo: 'preparacion' },
  { instruccion: 'INHALE lento y constante. Mantenga las bolas arriba el mayor tiempo posible.', duracion: 7, tipo: 'inhalar' },
  { instruccion: 'Mantenga...', duracion: 3, tipo: 'mantener' },
  { instruccion: 'Suelte lentamente. Respire con normalidad.', duracion: 7, tipo: 'descanso' },
  { instruccion: 'Repetición 3 de 8. Exhale todo el aire.', duracion: 5, tipo: 'exhalar' },
  { instruccion: 'Coloque la boquilla.', duracion: 2, tipo: 'preparacion' },
  { instruccion: 'INHALE lento. Prioriza la constancia, no la fuerza.', duracion: 7, tipo: 'inhalar' },
  { instruccion: 'Mantenga...', duracion: 3, tipo: 'mantener' },
  { instruccion: 'Suelte. Respire normalmente.', duracion: 7, tipo: 'descanso' },
  { instruccion: 'Repetición 4 de 8. Exhale todo el aire.', duracion: 5, tipo: 'exhalar' },
  { instruccion: 'Coloque la boquilla.', duracion: 2, tipo: 'preparacion' },
  { instruccion: 'INHALE constante. Mantenga las bolas arriba.', duracion: 7, tipo: 'inhalar' },
  { instruccion: 'Mantenga...', duracion: 3, tipo: 'mantener' },
  { instruccion: 'Suelte lentamente.', duracion: 6, tipo: 'descanso' },
  { instruccion: 'Pausa de descanso. Respire con normalidad durante unos momentos.', duracion: 12, tipo: 'descanso' },
  { instruccion: 'Repetición 5 de 8. Exhale todo el aire fuera.', duracion: 5, tipo: 'exhalar' },
  { instruccion: 'Coloque la boquilla.', duracion: 2, tipo: 'preparacion' },
  { instruccion: 'INHALE lento y constante. Mantenga las bolas arriba.', duracion: 7, tipo: 'inhalar' },
  { instruccion: 'Mantenga...', duracion: 3, tipo: 'mantener' },
  { instruccion: 'Suelte. Respire con normalidad.', duracion: 7, tipo: 'descanso' },
  { instruccion: 'Repetición 6 de 8. Exhale todo el aire.', duracion: 5, tipo: 'exhalar' },
  { instruccion: 'Coloque la boquilla.', duracion: 2, tipo: 'preparacion' },
  { instruccion: 'INHALE constante. Va muy bien.', duracion: 7, tipo: 'inhalar' },
  { instruccion: 'Mantenga...', duracion: 3, tipo: 'mantener' },
  { instruccion: 'Suelte lentamente. Respire normal.', duracion: 7, tipo: 'descanso' },
  { instruccion: 'Repetición 7 de 8. Exhale todo el aire.', duracion: 5, tipo: 'exhalar' },
  { instruccion: 'Coloque la boquilla.', duracion: 2, tipo: 'preparacion' },
  { instruccion: 'INHALE lento. Casi terminamos.', duracion: 7, tipo: 'inhalar' },
  { instruccion: 'Mantenga...', duracion: 3, tipo: 'mantener' },
  { instruccion: 'Suelte. Respire con normalidad.', duracion: 7, tipo: 'descanso' },
  { instruccion: 'Última repetición, 8 de 8. Exhale todo el aire.', duracion: 5, tipo: 'exhalar' },
  { instruccion: 'Coloque la boquilla.', duracion: 2, tipo: 'preparacion' },
  { instruccion: 'INHALE lento y constante por última vez. Mantenga las bolas elevadas.', duracion: 7, tipo: 'inhalar' },
  { instruccion: 'Mantenga la inspiración...', duracion: 3, tipo: 'mantener' },
  { instruccion: 'Suelte lentamente. Muy bien hecho.', duracion: 6, tipo: 'descanso' },
  { instruccion: 'Sesión completada. Descanse y respire con calma.', duracion: 8, tipo: 'descanso' },
];

const PASOS_TREN_INFERIOR: PasoGuiado[] = [
  { instruccion: 'Siéntese en una silla firme. Pies separados al ancho de los hombros.', duracion: 6, tipo: 'preparacion' },
  { instruccion: 'Espalda recta, manos cruzadas sobre el pecho o apoyadas en los muslos.', duracion: 5, tipo: 'preparacion' },
  { instruccion: '🛑 Si siente mareo, dolor en las rodillas o falta de aire, deténgase de inmediato.', duracion: 5, tipo: 'alerta' },
  { instruccion: '🪑 SENTADILLA 1 de 8: Inclínese adelante, levántese despacio… y siéntese con control.', duracion: 7, tipo: 'activo' },
  { instruccion: '🪑 SENTADILLA 2 de 8: Levántese… y siéntese.', duracion: 6, tipo: 'activo' },
  { instruccion: '🪑 SENTADILLA 3 de 8: Levántese… y siéntese.', duracion: 6, tipo: 'activo' },
  { instruccion: '🪑 SENTADILLA 4 de 8: Levántese… y siéntese.', duracion: 6, tipo: 'activo' },
  { instruccion: '🪑 SENTADILLA 5 de 8: Levántese… y siéntese.', duracion: 6, tipo: 'activo' },
  { instruccion: '🪑 SENTADILLA 6 de 8: Levántese… y siéntese.', duracion: 6, tipo: 'activo' },
  { instruccion: '🪑 SENTADILLA 7 de 8: Levántese… y siéntese.', duracion: 6, tipo: 'activo' },
  { instruccion: '🪑 SENTADILLA 8 de 8: Último. Levántese… y siéntese.', duracion: 6, tipo: 'activo' },
  { instruccion: '✨ Muy bien. Descanse 30 segundos. Respire con labios fruncidos.', duracion: 30, tipo: 'descanso' },
  { instruccion: '🦶 TALONES 1 de 12: Levante ambos talones del suelo… y baje.', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 TALONES 2 de 12: Suba… y baje.', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 TALONES 3 de 12: Suba… y baje.', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 TALONES 4 de 12: Suba… y baje.', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 TALONES 5 de 12: Suba… y baje.', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 TALONES 6 de 12: Suba… y baje.', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 TALONES 7 de 12: Suba… y baje.', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 TALONES 8 de 12: Suba… y baje.', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 TALONES 9 de 12: Suba… y baje.', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 TALONES 10 de 12: Suba… y baje.', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 TALONES 11 de 12: Suba… y baje.', duracion: 3, tipo: 'activo' },
  { instruccion: '🦶 TALONES 12 de 12: Último. Suba… y baje.', duracion: 3, tipo: 'activo' },
  { instruccion: '✅ ¡Tren inferior completado! Descanse sentada y respire con calma.', duracion: 8, tipo: 'descanso' },
];

const PASOS_TREN_SUPERIOR: PasoGuiado[] = [
  { instruccion: 'Siéntese en una silla firme con la espalda apoyada. Tome las pesas livianas o botellas de agua.', duracion: 7, tipo: 'preparacion' },
  { instruccion: 'Brazos a los costados, palmas hacia adelante para bíceps.', duracion: 5, tipo: 'preparacion' },
  { instruccion: '🛑 Si siente mareo o dolor en los hombros, deténgase.', duracion: 5, tipo: 'alerta' },
  { instruccion: '💪 BÍCEPS 1 de 8: Doble ambos codos subiendo las pesas… y baje lento.', duracion: 5, tipo: 'activo' },
  { instruccion: '💪 BÍCEPS 2 de 8: Suba… y baje.', duracion: 4, tipo: 'activo' },
  { instruccion: '💪 BÍCEPS 3 de 8: Suba… y baje.', duracion: 4, tipo: 'activo' },
  { instruccion: '💪 BÍCEPS 4 de 8: Suba… y baje.', duracion: 4, tipo: 'activo' },
  { instruccion: '💪 BÍCEPS 5 de 8: Suba… y baje.', duracion: 4, tipo: 'activo' },
  { instruccion: '💪 BÍCEPS 6 de 8: Suba… y baje.', duracion: 4, tipo: 'activo' },
  { instruccion: '💪 BÍCEPS 7 de 8: Suba… y baje.', duracion: 4, tipo: 'activo' },
  { instruccion: '💪 BÍCEPS 8 de 8: Último. Suba… y baje.', duracion: 4, tipo: 'activo' },
  { instruccion: '✨ Descanse 20 segundos. Respire con labios fruncidos.', duracion: 20, tipo: 'descanso' },
  { instruccion: 'Ahora press de hombros. Pesas a la altura de los hombros, palmas hacia adelante.', duracion: 6, tipo: 'preparacion' },
  { instruccion: '🏋️ PRESS 1 de 8: Suba las pesas por encima de la cabeza… y baje a los hombros.', duracion: 5, tipo: 'activo' },
  { instruccion: '🏋️ PRESS 2 de 8: Suba… y baje.', duracion: 4, tipo: 'activo' },
  { instruccion: '🏋️ PRESS 3 de 8: Suba… y baje.', duracion: 4, tipo: 'activo' },
  { instruccion: '🏋️ PRESS 4 de 8: Suba… y baje.', duracion: 4, tipo: 'activo' },
  { instruccion: '🏋️ PRESS 5 de 8: Suba… y baje.', duracion: 4, tipo: 'activo' },
  { instruccion: '🏋️ PRESS 6 de 8: Suba… y baje.', duracion: 4, tipo: 'activo' },
  { instruccion: '🏋️ PRESS 7 de 8: Suba… y baje.', duracion: 4, tipo: 'activo' },
  { instruccion: '🏋️ PRESS 8 de 8: Último. Suba… y baje.', duracion: 4, tipo: 'activo' },
  { instruccion: '✅ ¡Tren superior completado! Suelte las pesas y descanse.', duracion: 8, tipo: 'descanso' },
];

const PASOS_CAMINATA_INTERVALOS: PasoGuiado[] = [
  { instruccion: '⚠️ Asegúrese de tener el oxígeno puesto antes de empezar.', duracion: 6, tipo: 'alerta' },
  { instruccion: 'Póngase de pie con calma. Alternaremos ritmo normal y lento.', duracion: 6, tipo: 'preparacion' },
  { instruccion: '🚶 INTERVALO 1: Camine a ritmo NORMAL. Inhale 2 pasos, exhale 4 pasos.', duracion: 120, tipo: 'activo' },
  { instruccion: '🐢 Ahora más LENTO. Camine despacio, respire con calma.', duracion: 60, tipo: 'descanso' },
  { instruccion: '🚶 INTERVALO 2: Ritmo NORMAL de nuevo. Inhale 2, exhale 4.', duracion: 120, tipo: 'activo' },
  { instruccion: '🐢 LENTO. Baje el ritmo, labios fruncidos.', duracion: 60, tipo: 'descanso' },
  { instruccion: '🚶 INTERVALO 3: Ritmo NORMAL. Va muy bien.', duracion: 120, tipo: 'activo' },
  { instruccion: '🐢 LENTO. Respire con labios fruncidos.', duracion: 60, tipo: 'descanso' },
  { instruccion: '🚶 INTERVALO 4: Ritmo NORMAL. Casi terminamos.', duracion: 120, tipo: 'activo' },
  { instruccion: '🐢 LENTO. Descanse caminando.', duracion: 60, tipo: 'descanso' },
  { instruccion: '🚶 INTERVALO 5: Último tramo. Ritmo NORMAL.', duracion: 120, tipo: 'activo' },
  { instruccion: '🐢 LENTO. Vaya frenando el paso.', duracion: 60, tipo: 'descanso' },
  { instruccion: '✨ Pare y siéntese. Respire con calma.', duracion: 20, tipo: 'descanso' },
  { instruccion: '✅ ¡Caminata con intervalos completada! Revise su saturación.', duracion: 6, tipo: 'descanso' },
];

const PASOS_MOVILIDAD_COMPLETA: PasoGuiado[] = [
  { instruccion: 'Siéntese en una silla firme o de pie apoyándose en el respaldo.', duracion: 6, tipo: 'preparacion' },
  { instruccion: '🛑 Si siente dolor o mareo, deténgase y descanse.', duracion: 5, tipo: 'alerta' },
  { instruccion: '🫁 Apertura de pecho: Entrelace las manos detrás de la espalda. Abra el pecho sacando los hombros hacia atrás.', duracion: 10, tipo: 'activo' },
  { instruccion: '🫁 Mantenga la apertura… respire profundo.', duracion: 8, tipo: 'inhalar' },
  { instruccion: '💨 Suelte lentamente y relaje.', duracion: 5, tipo: 'exhalar' },
  { instruccion: '✨ Descanse unos segundos.', duracion: 8, tipo: 'descanso' },
  { instruccion: '🫁 Apertura de pecho de nuevo: manos detrás, abra el pecho.', duracion: 10, tipo: 'activo' },
  { instruccion: '🫁 Mantenga y respire…', duracion: 8, tipo: 'inhalar' },
  { instruccion: '💨 Suelte lentamente.', duracion: 5, tipo: 'exhalar' },
  { instruccion: '✨ Descanse.', duracion: 8, tipo: 'descanso' },
  { instruccion: '🔄 Rotación de tronco: Manos en los hombros. Gire el tronco hacia la DERECHA suavemente.', duracion: 8, tipo: 'activo' },
  { instruccion: '🔄 Mantenga la rotación… respire.', duracion: 5, tipo: 'mantener' },
  { instruccion: '🔄 Vuelva al centro y gire hacia la IZQUIERDA.', duracion: 8, tipo: 'activo' },
  { instruccion: '🔄 Mantenga… respire.', duracion: 5, tipo: 'mantener' },
  { instruccion: '✨ Descanse unos segundos.', duracion: 8, tipo: 'descanso' },
  { instruccion: '🔄 Otra vez: gire a la DERECHA.', duracion: 8, tipo: 'activo' },
  { instruccion: '🔄 Mantenga…', duracion: 5, tipo: 'mantener' },
  { instruccion: '🔄 Gire a la IZQUIERDA.', duracion: 8, tipo: 'activo' },
  { instruccion: '🔄 Mantenga…', duracion: 5, tipo: 'mantener' },
  { instruccion: '↔️ Inclinación lateral: Con un brazo arriba, inclínese suavemente a la DERECHA.', duracion: 8, tipo: 'activo' },
  { instruccion: '↔️ Vuelva al centro. Inclínese a la IZQUIERDA.', duracion: 8, tipo: 'activo' },
  { instruccion: '↔️ Derecha de nuevo…', duracion: 8, tipo: 'activo' },
  { instruccion: '↔️ Izquierda…', duracion: 8, tipo: 'activo' },
  { instruccion: '✅ ¡Movilidad completa terminada! Descanse.', duracion: 8, tipo: 'descanso' },
];

const PASOS_ESTIRAMIENTOS_TORACICOS: PasoGuiado[] = [
  { instruccion: 'Siéntese erguida con los pies planos en el suelo.', duracion: 5, tipo: 'preparacion' },
  { instruccion: 'Vamos a estirar la caja torácica para mejorar la expansión pulmonar.', duracion: 5, tipo: 'preparacion' },
  { instruccion: '🙆 Levante ambos brazos por encima de la cabeza. Estire como si quisiera tocar el techo.', duracion: 8, tipo: 'activo' },
  { instruccion: '🫁 INHALE profundo mientras mantiene los brazos arriba…', duracion: 5, tipo: 'inhalar' },
  { instruccion: '💨 EXHALE y baje los brazos lentamente.', duracion: 5, tipo: 'exhalar' },
  { instruccion: '✨ Descanse.', duracion: 6, tipo: 'descanso' },
  { instruccion: '🙆 Manos detrás de la nuca. Abra los codos hacia los lados lo más que pueda.', duracion: 8, tipo: 'activo' },
  { instruccion: '🫁 INHALE profundo, abriendo bien el pecho…', duracion: 5, tipo: 'inhalar' },
  { instruccion: '💨 EXHALE y relaje los codos hacia adelante.', duracion: 5, tipo: 'exhalar' },
  { instruccion: '🙆 Abra los codos de nuevo…', duracion: 8, tipo: 'activo' },
  { instruccion: '🫁 INHALE expandiendo las costillas…', duracion: 5, tipo: 'inhalar' },
  { instruccion: '💨 EXHALE y relaje.', duracion: 5, tipo: 'exhalar' },
  { instruccion: '✨ Descanse.', duracion: 6, tipo: 'descanso' },
  { instruccion: '🔄 Mano derecha en rodilla izquierda. Gire suavemente el torso a la izquierda.', duracion: 10, tipo: 'activo' },
  { instruccion: '🫁 INHALE en esta posición…', duracion: 4, tipo: 'inhalar' },
  { instruccion: '💨 EXHALE y gire un poco más…', duracion: 5, tipo: 'exhalar' },
  { instruccion: '🔄 Ahora al otro lado. Mano izquierda en rodilla derecha. Gire a la derecha.', duracion: 10, tipo: 'activo' },
  { instruccion: '🫁 INHALE…', duracion: 4, tipo: 'inhalar' },
  { instruccion: '💨 EXHALE y gire un poco más…', duracion: 5, tipo: 'exhalar' },
  { instruccion: '✅ ¡Estiramientos torácicos completados! Su caja torácica está más flexible.', duracion: 6, tipo: 'descanso' },
];

/* ════════════════════════════════════════════════════════════════════════════
   DATOS — BIBLIOTECA DE EJERCICIOS
   ════════════════════════════════════════════════════════════════════════════ */

const EJERCICIOS: Ejercicio[] = [
  /* ── Respiratorios ── */
  {
    id: 'respiracion-dorada',
    nombre: 'Respiración Dorada',
    icono: '🌟',
    categoria: 'respiratorio',
    descripcionCorta: 'Visualización guiada para calmar y oxigenar. Ideal al despertar.',
    beneficio: 'Reduce la ansiedad, mejora la saturación de oxígeno y prepara el cuerpo para el día.',
    duracionMin: 5,
    dificultad: 'Fácil',
    pasos: PASOS_DORADA,
  },
  {
    id: 'diafragmatica',
    nombre: 'Respiración Diafragmática',
    icono: '🫁',
    categoria: 'respiratorio',
    descripcionCorta: 'Respiración abdominal para fortalecer el diafragma.',
    beneficio: 'Aumenta la capacidad pulmonar, reduce el trabajo respiratorio y mejora el intercambio de gases.',
    duracionMin: 5,
    dificultad: 'Fácil',
    pasos: PASOS_DIAFRAGMATICO,
  },
  {
    id: 'labios-fruncidos',
    nombre: 'Respiración con Labios Fruncidos',
    icono: '💋',
    categoria: 'respiratorio',
    descripcionCorta: 'La "llave maestra" cuando falta el aire. Inhalar 2 seg, exhalar 4 seg.',
    beneficio: 'Mantiene los alveolos abiertos más tiempo, mejora el vaciado pulmonar y reduce la sensación de ahogo.',
    duracionMin: 5,
    dificultad: 'Fácil',
    pasos: PASOS_LABIOS,
    advertencias: ['Usar siempre que sienta falta de aire durante actividades.'],
  },
  {
    id: 'huffing',
    nombre: 'Limpieza Bronquial (Huffing)',
    icono: '💨',
    categoria: 'respiratorio',
    descripcionCorta: 'Técnica de tos dirigida para expulsar flemas sin esfuerzo.',
    beneficio: 'Moviliza y elimina secreciones de forma eficiente, evitando la tos violenta que baja la saturación.',
    duracionMin: 5,
    dificultad: 'Moderado',
    pasos: PASOS_HUFFING,
    advertencias: [
      'Realizar con el oxígeno puesto.',
      'Si sale flema con sangre, avisar al médico (por el Xarelto).',
    ],
  },
  /* ── Con Aparatos ── */
  {
    id: 'acapella',
    nombre: 'Acapella Choice',
    icono: '🎵',
    categoria: 'aparatos',
    requiereAparato: 'Dispositivo Acapella Choice',
    descripcionCorta: 'PEP vibratorio: 10 ciclos guiados + tos dirigida para expulsar secreciones.',
    beneficio: 'Combina vibración con presión positiva espiratoria (PEP). Afloja y mueve las flemas hacia las vías aéreas grandes para poder expulsarlas.',
    duracionMin: 10,
    dificultad: 'Moderado',
    pasos: PASOS_ACAPELLA,
    advertencias: [
      'Realizar con el oxígeno puesto.',
      'Si siente mareos, deténgase y descanse.',
      'No forzar la exhalación: debe ser constante, no brusca.',
    ],
  },
  {
    id: 'triflo',
    nombre: 'Triflo (Incentivador Volumétrico)',
    icono: '🫧',
    categoria: 'aparatos',
    requiereAparato: 'Incentivador Volumétrico Triflo',
    descripcionCorta: 'Dispositivo de expansión pulmonar: 8 repeticiones guiadas para mantener las bolas elevadas.',
    beneficio: 'A diferencia del Acapella, este aparato trabaja en la INSPIRACIÓN. Expande los pulmones, previene atelectasias (colapso de alveolos) y mejora la capacidad pulmonar.',
    duracionMin: 8,
    dificultad: 'Moderado',
    pasos: PASOS_TRIFLO,
    advertencias: [
      'Si sientes mareos, descansa inmediatamente.',
      'No más de 10 repeticiones seguidas sin pausa.',
      'Usar con el oxígeno puesto si se indica.',
    ],
  },
  /* ── Movilidad ── */
  {
    id: 'movilidad-silla',
    nombre: 'Movilidad en Silla',
    icono: '🪑',
    categoria: 'movilidad',
    descripcionCorta: 'Elevación de talones y círculos de hombros desde la silla.',
    beneficio: 'Activa la circulación en piernas para reducir la hinchazón, mejora el retorno venoso y mantiene la fuerza muscular.',
    duracionMin: 10,
    dificultad: 'Fácil',
    pasos: PASOS_SILLA,
    advertencias: [
      'Detenerse si hay mareos, falta de aire o dolor en el pecho.',
      'Usar silla firme y estable.',
    ],
  },
  {
    id: 'caminata',
    nombre: 'Caminata Terapéutica',
    icono: '🚶',
    categoria: 'movilidad',
    descripcionCorta: 'Caminata lenta de 5-10 min coordinada con respiración de labios fruncidos.',
    beneficio: 'Mantiene la capacidad funcional, mejora el estado de ánimo y entrena la tolerancia al esfuerzo.',
    duracionMin: 10,
    dificultad: 'Moderado',
    pasos: PASOS_CAMINATA,
    advertencias: [
      'Obligatorio con oxígeno puesto.',
      'Detenerse si la saturación baja de 90%.',
      'Paso muy lento al inicio.',
    ],
  },
  /* ── Fortalecimiento ── */
  {
    id: 'tren-inferior',
    nombre: 'Fortalecimiento Tren Inferior',
    icono: '🦵',
    categoria: 'movilidad',
    descripcionCorta: 'Sentadillas en silla y elevaciones de talones para fortalecer piernas.',
    beneficio: 'Fortalece cuádriceps y pantorrillas, mejora el equilibrio y activa la circulación de retorno.',
    duracionMin: 8,
    dificultad: 'Moderado',
    pasos: PASOS_TREN_INFERIOR,
    advertencias: [
      'Detenerse si siente dolor en las rodillas.',
      'Usar silla firme y estable, sin ruedas.',
    ],
  },
  {
    id: 'tren-superior',
    nombre: 'Fortalecimiento Tren Superior',
    icono: '💪',
    categoria: 'movilidad',
    descripcionCorta: 'Bíceps y press de hombros con pesas livianas o botellas de agua.',
    beneficio: 'Fortalece brazos y hombros, facilita las actividades diarias y mejora la postura.',
    duracionMin: 8,
    dificultad: 'Moderado',
    requiereAparato: 'Pesas livianas o botellas de agua',
    pasos: PASOS_TREN_SUPERIOR,
    advertencias: [
      'Use pesas de máximo 1-2 kg o botellas de agua de 500ml.',
      'No levante por encima de la cabeza si siente dolor en los hombros.',
    ],
  },
  {
    id: 'caminata-intervalos',
    nombre: 'Caminata con Intervalos',
    icono: '🏃',
    categoria: 'movilidad',
    descripcionCorta: '5 intervalos: 2 min ritmo normal / 1 min ritmo lento.',
    beneficio: 'Mejora la tolerancia al esfuerzo de forma progresiva, entrenando al cuerpo a recuperarse más rápido.',
    duracionMin: 18,
    dificultad: 'Moderado',
    pasos: PASOS_CAMINATA_INTERVALOS,
    advertencias: [
      'Obligatorio con oxígeno puesto.',
      'Detenerse si la saturación baja de 90%.',
      'En terreno llano, sin pendientes.',
    ],
  },
  {
    id: 'movilidad-completa',
    nombre: 'Movilidad Completa',
    icono: '🧘',
    categoria: 'movilidad',
    descripcionCorta: 'Apertura de pecho, rotación de tronco e inclinaciones laterales.',
    beneficio: 'Mejora la flexibilidad de la caja torácica, facilita la expansión pulmonar y alivia la rigidez muscular.',
    duracionMin: 10,
    dificultad: 'Fácil',
    pasos: PASOS_MOVILIDAD_COMPLETA,
  },
  {
    id: 'estiramientos-toracicos',
    nombre: 'Movilidad Torácica',
    icono: '🙆',
    categoria: 'movilidad',
    descripcionCorta: 'Estiramientos de la caja torácica coordinados con respiración.',
    beneficio: 'Aumenta la elasticidad intercostal, mejora la capacidad de expansión pulmonar en cada respiración.',
    duracionMin: 8,
    dificultad: 'Fácil',
    pasos: PASOS_ESTIRAMIENTOS_TORACICOS,
  },
];

/* ════════════════════════════════════════════════════════════════════════════
   DATOS — PLANIFICACIÓN SEMANAL
   ════════════════════════════════════════════════════════════════════════════ */

interface DiaRutina {
  nombre: string;
  nombreCorto: string;
  actividad: string;
  intensidad: string;
  ejercicioId: string | null;
  colorIntensidad: string;
}

// Índice 0 = Lunes … 6 = Domingo
const RUTINA_SEMANAL: DiaRutina[] = [
  { nombre: 'Lunes', nombreCorto: 'L', actividad: 'Sentadillas en silla y elevación de talones', intensidad: 'Moderada', ejercicioId: 'tren-inferior', colorIntensidad: 'bg-yellow-100 text-yellow-700' },
  { nombre: 'Martes', nombreCorto: 'M', actividad: 'Caminata continua 10-20 min con labios fruncidos', intensidad: 'Leve', ejercicioId: 'caminata', colorIntensidad: 'bg-green-100 text-green-700' },
  { nombre: 'Miércoles', nombreCorto: 'X', actividad: 'Descanso activo: solo estiramientos y Acapella/Triflo', intensidad: 'Baja', ejercicioId: null, colorIntensidad: 'bg-blue-100 text-blue-700' },
  { nombre: 'Jueves', nombreCorto: 'J', actividad: 'Bíceps y press de hombros con pesas livianas', intensidad: 'Moderada', ejercicioId: 'tren-superior', colorIntensidad: 'bg-yellow-100 text-yellow-700' },
  { nombre: 'Viernes', nombreCorto: 'V', actividad: 'Caminata con intervalos (2 min normal / 1 min lento ×5)', intensidad: 'Moderada', ejercicioId: 'caminata-intervalos', colorIntensidad: 'bg-yellow-100 text-yellow-700' },
  { nombre: 'Sábado', nombreCorto: 'S', actividad: 'Apertura de pecho y rotación de tronco', intensidad: 'Leve', ejercicioId: 'movilidad-completa', colorIntensidad: 'bg-green-100 text-green-700' },
  { nombre: 'Domingo', nombreCorto: 'D', actividad: 'Priorizar relajación y limpieza respiratoria', intensidad: 'Nula', ejercicioId: null, colorIntensidad: 'bg-gray-100 text-gray-600' },
];

/** JS getDay: 0=Dom … 6=Sáb → nuestro índice 0=Lun … 6=Dom */
function getDiaRutinaIdx(): number {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

interface BloqueHorario {
  bloqueId: string;      // único por slot del día
  hora: string;
  nombre: string;
  icono: string;
  ejercicioId: string | null;
  duracion: string;
  objetivo: string;
  tipo: 'ejercicio' | 'comida' | 'info';
}

function getBloquesHoy(diaIdx: number, modoFatiga: boolean): BloqueHorario[] {
  const rutina = RUTINA_SEMANAL[diaIdx];
  const esDomingo = diaIdx === 6;
  const esDescansoActivo = diaIdx === 2;

  const bloques: BloqueHorario[] = [
    { bloqueId: 'acapella-manana', hora: '08:30', nombre: 'Higiene Respiratoria (Acapella)', icono: '🎵', ejercicioId: 'acapella', duracion: '10-15 min', objetivo: 'Movilizar secreciones acumuladas durante la noche', tipo: 'ejercicio' },
    { bloqueId: 'desayuno', hora: '09:00', nombre: 'Desayuno Nutritivo', icono: '🍳', ejercicioId: null, duracion: '', objetivo: 'Energía para el día', tipo: 'comida' },
  ];

  if (esDomingo) {
    bloques.push({ bloqueId: 'descanso-total', hora: '11:00', nombre: 'Descanso Total', icono: '😴', ejercicioId: null, duracion: '', objetivo: 'Priorizar relajación y limpieza respiratoria', tipo: 'info' });
  } else if (modoFatiga) {
    bloques.push({ bloqueId: 'fatiga-info', hora: '11:00', nombre: 'Día de fatiga — Solo respiratorio', icono: '😮‍💨', ejercicioId: null, duracion: '', objetivo: 'Prioriza solo Acapella y Triflo. Deja el ejercicio para mañana.', tipo: 'info' });
  } else if (esDescansoActivo) {
    bloques.push({ bloqueId: 'descanso-activo', hora: '11:00', nombre: 'Descanso Activo: Estiramientos', icono: '🧘', ejercicioId: 'estiramientos-toracicos', duracion: '10 min', objetivo: 'Solo estiramientos suaves y uso de Acapella/Triflo', tipo: 'ejercicio' });
  } else if (rutina.ejercicioId) {
    bloques.push({ bloqueId: 'ejercicio-dia', hora: '11:00', nombre: rutina.actividad, icono: '💪', ejercicioId: rutina.ejercicioId, duracion: '20-30 min', objetivo: `Intensidad ${rutina.intensidad.toLowerCase()}`, tipo: 'ejercicio' });
  }

  if (!esDomingo) {
    bloques.push({ bloqueId: 'triflo-manana', hora: '11:30', nombre: 'Expansión Pulmonar (Triflo)', icono: '🫧', ejercicioId: 'triflo', duracion: '5-10 min', objetivo: 'Reclutar alveolos después del esfuerzo físico', tipo: 'ejercicio' });
  }

  bloques.push(
    { bloqueId: 'almuerzo', hora: '13:30', nombre: 'Almuerzo', icono: '🍽️', ejercicioId: null, duracion: '', objetivo: 'Alimentación equilibrada', tipo: 'comida' },
    { bloqueId: 'movilidad-tarde', hora: '16:00', nombre: 'Movilidad Torácica / Estiramientos', icono: '🙆', ejercicioId: 'estiramientos-toracicos', duracion: '10 min', objetivo: 'Mantener la flexibilidad de la caja torácica', tipo: 'ejercicio' },
    { bloqueId: 'acapella-vespertina', hora: '18:30', nombre: 'Higiene Respiratoria (Acapella)', icono: '🎵', ejercicioId: 'acapella', duracion: '10-15 min', objetivo: 'Limpieza vespertina para mejorar el descanso nocturno', tipo: 'ejercicio' },
    { bloqueId: 'relajacion-noche', hora: '20:00', nombre: 'Relajación / Respiración Diafragmática', icono: '🌙', ejercicioId: 'diafragmatica', duracion: '5-10 min', objetivo: 'Bajar el ritmo y controlar la disnea antes de dormir', tipo: 'ejercicio' },
  );

  return bloques;
}

const RECOMENDACIONES = [
  { icono: '🎵', titulo: 'Acapella antes del ejercicio', texto: 'Úsalo siempre antes del ejercicio físico si sientes flemas; despejará tus vías aéreas y rendirás mejor.' },
  { icono: '🫧', titulo: 'Triflo después de comer', texto: 'No lo uses inmediatamente después de comer para evitar reflujo. Es ideal hacerlo en momentos de calma.' },
  { icono: '💧', titulo: 'Hidratación constante', texto: 'Bebe agua durante el día. La hidratación es el mejor "jarabe" para que las secreciones sean más fáciles de expulsar.' },
  { icono: '📊', titulo: 'Escala de fatiga', texto: 'El ejercicio debe sentirse como un 4 o 5 de 10. No debes llegar al punto de no poder recuperar el aliento en menos de 2 minutos.' },
];

/* ════════════════════════════════════════════════════════════════════════════
   HELPERS DEL MODAL GUIADO
   ════════════════════════════════════════════════════════════════════════════ */

function fmtTime(seg: number) {
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}`;
}

const CIRCLE_CFG: Record<TipoPaso, { bg: string; ring: string; label: string }> = {
  inhalar:     { bg: 'bg-blue-500',    ring: 'bg-blue-300',    label: 'INHALE' },
  exhalar:     { bg: 'bg-emerald-500', ring: 'bg-emerald-300', label: 'EXHALE' },
  mantener:    { bg: 'bg-amber-400',   ring: 'bg-amber-200',   label: 'MANTENGA' },
  descanso:    { bg: 'bg-slate-400',   ring: 'bg-slate-200',   label: 'DESCANSO' },
  activo:      { bg: 'bg-purple-500',  ring: 'bg-purple-300',  label: 'EJERCICIO' },
  preparacion: { bg: 'bg-gray-400',    ring: 'bg-gray-200',    label: 'PREPARACIÓN' },
  alerta:      { bg: 'bg-red-500',     ring: 'bg-red-300',     label: '⚠️ ATENCIÓN' },
};

/* ════════════════════════════════════════════════════════════════════════════
   COMPONENTES
   ════════════════════════════════════════════════════════════════════════════ */

const CATEGORIA_LABEL: Record<CategoriaEjercicio, string> = {
  respiratorio: 'Respiratorio',
  aparatos: 'Con Aparatos',
  movilidad: 'Movilidad',
};

const CATEGORIA_COLOR: Record<CategoriaEjercicio, string> = {
  respiratorio: 'bg-blue-100 text-blue-700',
  aparatos: 'bg-purple-100 text-purple-700',
  movilidad: 'bg-green-100 text-green-700',
};

const DIFICULTAD_COLOR = {
  Fácil: 'bg-green-100 text-green-700',
  Moderado: 'bg-yellow-100 text-yellow-700',
};

function BadgeCategoria({ categoria }: { categoria: CategoriaEjercicio }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${CATEGORIA_COLOR[categoria]}`}>
      {CATEGORIA_LABEL[categoria]}
    </span>
  );
}

function BadgeDificultad({ dificultad }: { dificultad: Ejercicio['dificultad'] }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${DIFICULTAD_COLOR[dificultad]}`}>
      {dificultad}
    </span>
  );
}

/* ─── Tarjeta de Ejercicio ─── */
function TarjetaEjercicio({
  ejercicio,
  onIniciar,
  onVerDetalle,
}: {
  ejercicio: Ejercicio;
  onIniciar: (e: Ejercicio) => void;
  onVerDetalle: (e: Ejercicio) => void;
}) {
  return (
    <Card color="white" className="mb-3">
      <div className="flex items-start gap-3">
        <span className="text-4xl">{ejercicio.icono}</span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1.5 mb-1">
            <BadgeCategoria categoria={ejercicio.categoria} />
            <BadgeDificultad dificultad={ejercicio.dificultad} />
            {ejercicio.requiereAparato && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                🔧 {ejercicio.requiereAparato}
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-gray-800">{ejercicio.nombre}</h3>
          <p className="text-sm text-gray-600 mt-0.5">{ejercicio.descripcionCorta}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span>⏱️ ~{ejercicio.duracionMin} min</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onVerDetalle(ejercicio)}
          className="flex-1 py-2 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Ver detalles
        </button>
        <button
          onClick={() => onIniciar(ejercicio)}
          className="flex-1 py-2 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors"
        >
          {ejercicio.pasos ? '▶ Iniciar guiado' : '📖 Ver instrucciones'}
        </button>
      </div>
    </Card>
  );
}

/* ─── Modal de Instrucciones Estáticas (Aparatos) ─── */
function ModalInstrucciones({
  ejercicio,
  onCerrar,
}: {
  ejercicio: Ejercicio;
  onCerrar: () => void;
}) {
  return (
    <div className="fixed inset-x-0 top-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] z-[60] bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col max-h-full">
        {/* Header */}
        <div className="bg-purple-600 px-5 py-4 flex items-center gap-3">
          <span className="text-4xl">{ejercicio.icono}</span>
          <div className="flex-1">
            <p className="text-purple-200 text-sm font-medium">Con Aparatos</p>
            <h2 className="text-white text-xl font-bold">{ejercicio.nombre}</h2>
          </div>
          <button onClick={onCerrar} className="text-white text-3xl leading-none hover:opacity-70 transition-opacity" aria-label="Cerrar">✕</button>
        </div>

        {/* Contenido */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Beneficio */}
          <div className="bg-purple-50 rounded-xl p-3 border border-purple-200">
            <p className="text-purple-800 text-sm font-medium">🎯 Beneficio</p>
            <p className="text-purple-700 text-sm mt-1">{ejercicio.beneficio}</p>
          </div>

          {/* Instrucciones */}
          {ejercicio.instruccionesEstaticas?.map((seccion, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h4 className="font-bold text-gray-800 mb-2">{seccion.titulo}</h4>
              <ol className="space-y-2">
                {seccion.pasos.map((paso, j) => (
                  <li key={j} className="flex gap-2 text-sm text-gray-700">
                    <span className="font-bold text-gray-400 min-w-[1.2rem]">{j + 1}.</span>
                    <span>{paso}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}

          {/* Advertencias */}
          {ejercicio.advertencias && ejercicio.advertencias.length > 0 && (
            <div className="bg-red-50 rounded-xl p-3 border border-red-200">
              <p className="text-red-700 font-bold text-sm mb-1">⚠️ Precauciones</p>
              <ul className="space-y-1">
                {ejercicio.advertencias.map((a, i) => (
                  <li key={i} className="text-red-600 text-sm flex gap-1.5">
                    <span>•</span><span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <Button variant="secondary" fullWidth onClick={onCerrar}>Cerrar</Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Modal Guiado con Timer, Voz y Sonidos ─── */
function ModalGuiado({
  ejercicio,
  onCerrar,
  onCompletado,
}: {
  ejercicio: Ejercicio;
  onCerrar: () => void;
  onCompletado: () => void;
}) {
  const pasos = ejercicio.pasos!;
  const [pasoIdx, setPasoIdx] = useState(0);
  const [seg, setSeg] = useState(pasos[0].duracion);
  const [enCurso, setEnCurso] = useState(false);
  const [terminado, setTerminado] = useState(false);

  /* ── SpO2 pre/post ── */
  const [showPre, setShowPre]     = useState(true);
  const [showPost, setShowPost]   = useState(false);
  const [spo2Pre, setSpo2Pre]     = useState(0);
  const [pulsoPre, setPulsoPre]   = useState(0);
  const [spo2Post, setSpo2Post]   = useState(0);
  const [pulsoPost, setPulsoPost] = useState(0);
  const [spo2Guardado, setSpo2Guardado] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioReadyRef = useRef(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  /* ── Cargar voces TTS ── */
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const load = () => { voicesRef.current = window.speechSynthesis.getVoices(); };
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  /* ── Cleanup al desmontar ── */
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
      wakeLockRef.current?.release().catch(() => {});
    };
  }, []);

  /* ── Inicializar AudioContext ── */
  const initAudio = useCallback(async () => {
    if (audioReadyRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    audioCtxRef.current = new AC() as AudioContext;
    try { await audioCtxRef.current.resume(); } catch { /* noop */ }
    audioReadyRef.current = true;
  }, []);

  /* ── Sonidos ── */
  const playInhale = useCallback((dur = 0.9) => {
    const ctx = audioCtxRef.current; if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(300, now);
      o.frequency.linearRampToValueAtTime(750, now + dur);
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.1, now + dur * 0.5);
      g.gain.linearRampToValueAtTime(0.02, now + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(now); o.stop(now + dur + 0.05);
    } catch { /* noop */ }
  }, []);

  const playExhale = useCallback((dur = 0.9) => {
    const ctx = audioCtxRef.current; if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(750, now);
      o.frequency.linearRampToValueAtTime(300, now + dur);
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.1, now + dur * 0.4);
      g.gain.linearRampToValueAtTime(0.01, now + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(now); o.stop(now + dur + 0.05);
    } catch { /* noop */ }
  }, []);

  const playHold = useCallback(() => {
    const ctx = audioCtxRef.current; if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 528;
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.06, now + 0.05);
      g.gain.linearRampToValueAtTime(0.03, now + 0.35);
      g.gain.linearRampToValueAtTime(0.001, now + 0.5);
      o.connect(g); g.connect(ctx.destination);
      o.start(now); o.stop(now + 0.55);
    } catch { /* noop */ }
  }, []);

  /* ── TTS ── */
  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, '').replace(/\s+/g, ' ').trim();
      if (!clean) return;
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = 'es-ES'; u.rate = 0.85; u.pitch = 0.95; u.volume = 0.92;
      const vv = voicesRef.current;
      const best = vv.find(v => v.lang?.startsWith('es') && /google|sofia|lucia|maria|mónica|monica/i.test(v.name))
        || vv.find(v => v.lang?.startsWith('es'))
        || vv[0];
      if (best) u.voice = best;
      window.speechSynthesis.speak(u);
    } catch { /* noop */ }
  }, []);

  /* ── WakeLock ── */
  const acquireWake = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    try { wakeLockRef.current = await (navigator as any).wakeLock.request('screen'); } catch { /* noop */ }
  }, []);
  const releaseWake = useCallback(() => {
    wakeLockRef.current?.release().catch(() => {}); wakeLockRef.current = null;
  }, []);

  /* ── Limpiar intervalo ── */
  const limpiarInterval = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  /* ── Timer: cuenta regresiva cada segundo, sin sonido de tick ── */
  useEffect(() => {
    if (!enCurso) return;
    limpiarInterval();
    intervalRef.current = setInterval(() => {
      setSeg((s) => {
        if (s <= 1) {
          const next = pasoIdx + 1;
          if (next >= pasos.length) {
            setEnCurso(false);
            setTerminado(true);
            limpiarInterval();
            return 0;
          }
          setPasoIdx(next);
          return pasos[next].duracion;
        }
        return s - 1;
      });
    }, 1000);
    return () => limpiarInterval();
  }, [enCurso, pasoIdx, pasos, limpiarInterval]);

  /* ── Sonido + voz al inicio de cada paso ── */
  useEffect(() => {
    if (!enCurso || !audioReadyRef.current) return;
    const p = pasos[pasoIdx];
    if (!p) return;
    if (p.tipo === 'inhalar') playInhale(Math.min(p.duracion * 0.7, 2.5));
    else if (p.tipo === 'exhalar') playExhale(Math.min(p.duracion * 0.7, 2.5));
    else if (p.tipo === 'mantener') playHold();
    speak(p.instruccion);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pasoIdx, enCurso]);

  /* ── Al completar: mostrar post-registro (SpO2 final) ── */
  useEffect(() => {
    if (!terminado) return;
    releaseWake();
    setShowPost(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terminado]);

  const paso = pasos[pasoIdx];
  const cfg = CIRCLE_CFG[paso.tipo];
  const progresoGlobal = Math.round(((pasoIdx + 1) / pasos.length) * 100);
  const progresoPaso = paso.duracion > 0 ? ((paso.duracion - seg) / paso.duracion) * 100 : 0;

  const animCirculo =
    paso.tipo === 'inhalar' ? 'animate-breathe-in' :
    paso.tipo === 'exhalar' ? 'animate-breathe-out' :
    paso.tipo === 'mantener' ? 'animate-breathe-hold' : '';

  const phasePanelClass =
    paso.tipo === 'inhalar' ? 'phase-panel--inhalar' :
    paso.tipo === 'exhalar' ? 'phase-panel--exhalar' :
    paso.tipo === 'mantener' ? 'phase-panel--mantener' :
    paso.tipo === 'activo' ? 'phase-panel--activo' :
    paso.tipo === 'alerta' ? 'phase-panel--alerta' :
    paso.tipo === 'preparacion' ? 'phase-panel--preparacion' :
    'phase-panel--descanso';

  async function iniciar() {
    await initAudio();
    setPasoIdx(0); setSeg(pasos[0].duracion);
    setTerminado(false); setEnCurso(true);
    acquireWake();
    // Pequeño delay para que el AudioContext esté listo antes del primer speak
    setTimeout(() => speak(pasos[0].instruccion), 300);
  }

  function pausar() {
    setEnCurso(false); limpiarInterval();
    try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
  }
  function reanudar() { setEnCurso(true); }
  function reiniciar() {
    limpiarInterval(); releaseWake();
    try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
    setPasoIdx(0); setSeg(pasos[0].duracion); setEnCurso(false); setTerminado(false);
  }
  function cerrar() {
    limpiarInterval(); releaseWake();
    try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
    onCerrar();
  }

  return (
    <div className="fixed inset-x-0 top-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] z-[60] bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-green-700 px-5 py-4 flex items-center gap-3 flex-shrink-0">
        <span className="text-3xl">{ejercicio.icono}</span>
        <div className="flex-1 min-w-0">
          <p className="text-green-200 text-xs uppercase font-semibold tracking-wider">Ejercicio guiado · 🔊 Voz activada</p>
          <h2 className="text-white text-lg font-bold leading-tight truncate">{ejercicio.nombre}</h2>
        </div>
        <button onClick={cerrar} className="text-white text-2xl leading-none p-1 hover:opacity-70 transition-opacity flex-shrink-0" aria-label="Cerrar">✕</button>
      </div>

      {/* Barra de progreso global */}
      <div className="h-1.5 bg-green-200 flex-shrink-0">
        <div className="h-full bg-green-600 transition-all duration-700" style={{ width: `${progresoGlobal}%` }} />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-6 flex flex-col items-center gap-5 max-w-md mx-auto w-full">
        {showPre ? (
          /* ── PRE-REGISTRO SpO2 ── */
          <div className="flex flex-col gap-5 py-2 w-full">
            <div className="text-center">
              <span className="text-6xl">{ejercicio.icono}</span>
              <h3 className="text-xl font-bold text-gray-800 mt-2">{ejercicio.nombre}</h3>
              <p className="text-gray-500 text-sm mt-1">~{ejercicio.duracionMin} min · {pasos.length} pasos</p>
            </div>

            <div className="w-full bg-blue-50 rounded-2xl p-5 border-2 border-blue-200">
              <h3 className="text-lg font-bold text-blue-800 mb-1">🫁 Medición inicial</h3>
              <p className="text-sm text-blue-600 mb-4">Anote su saturación y pulso antes de comenzar. Puede omitir si no tiene el oxímetro a mano.</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Saturación SpO2 (%)</label>
                  <input
                    type="number" inputMode="numeric"
                    value={spo2Pre || ''}
                    onChange={(e) => setSpo2Pre(Number(e.target.value))}
                    placeholder="Ej: 92"
                    min={70} max={100}
                    className="w-full text-center text-3xl font-bold py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none bg-white text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Pulso (lat/min)</label>
                  <input
                    type="number" inputMode="numeric"
                    value={pulsoPre || ''}
                    onChange={(e) => setPulsoPre(Number(e.target.value))}
                    placeholder="Ej: 78"
                    min={30} max={200}
                    className="w-full text-center text-3xl font-bold py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none bg-white text-gray-800"
                  />
                </div>
              </div>
              {spo2Pre > 0 && spo2Pre < 88 && (
                <div className="mt-3 bg-red-600 text-white rounded-xl p-3 flex items-center gap-2">
                  <span className="text-xl">🚨</span>
                  <p className="font-bold text-sm">Saturación muy baja. Consulte al médico antes de hacer ejercicio.</p>
                </div>
              )}
            </div>

            {ejercicio.advertencias && ejercicio.advertencias.length > 0 && (
              <div className="w-full bg-red-50 rounded-xl p-3 border border-red-200 space-y-1">
                {ejercicio.advertencias.map((a, i) => (
                  <p key={i} className="text-red-600 text-sm flex gap-1.5"><span>⚠️</span><span>{a}</span></p>
                ))}
              </div>
            )}

            <button
              onClick={async () => {
                setShowPre(false);
                await initAudio();
                setPasoIdx(0); setSeg(pasos[0].duracion);
                setTerminado(false); setEnCurso(true);
                acquireWake();
                setTimeout(() => speak(pasos[0].instruccion), 300);
              }}
              className="w-full py-5 bg-green-600 text-white rounded-2xl text-xl font-bold hover:bg-green-700 active:scale-95 transition-all shadow-lg"
            >
              {spo2Pre > 0 ? '▶ Continuar al ejercicio' : '▶ Comenzar (omitir medición)'}
            </button>
          </div>
        ) : terminado && showPost ? (
          /* ── POST-REGISTRO SpO2 ── */
          <div className="flex flex-col gap-5 py-2 w-full">
            <div className="text-center">
              <span className="text-6xl">✅</span>
              <h3 className="text-2xl font-black text-gray-800 mt-2">¡Ejercicio completado!</h3>
              <p className="text-gray-500 text-sm mt-1">Excelente trabajo. Descanse y respire con calma.</p>
            </div>

            <div className="w-full bg-blue-50 rounded-2xl p-5 border-2 border-blue-200">
              <h3 className="text-lg font-bold text-blue-800 mb-1">🫁 Medición final</h3>
              <p className="text-sm text-blue-600 mb-4">Anote su saturación y pulso ahora para registrar el progreso.</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Saturación SpO2 (%)</label>
                  <input
                    type="number" inputMode="numeric"
                    value={spo2Post || ''}
                    onChange={(e) => setSpo2Post(Number(e.target.value))}
                    placeholder="Ej: 90"
                    min={70} max={100}
                    className="w-full text-center text-3xl font-bold py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none bg-white text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Pulso (lat/min)</label>
                  <input
                    type="number" inputMode="numeric"
                    value={pulsoPost || ''}
                    onChange={(e) => setPulsoPost(Number(e.target.value))}
                    placeholder="Ej: 85"
                    min={30} max={200}
                    className="w-full text-center text-3xl font-bold py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none bg-white text-gray-800"
                  />
                </div>
              </div>

              {spo2Pre > 0 && spo2Post > 0 && (
                <div className={`mt-3 rounded-xl p-3 flex items-center gap-2 ${spo2Post >= spo2Pre - 2 ? 'bg-green-100 border border-green-300 text-green-800' : 'bg-orange-100 border border-orange-300 text-orange-800'}`}>
                  <span>{spo2Post >= spo2Pre - 2 ? '✅' : '⚠️'}</span>
                  <p className="font-semibold text-sm">
                    {spo2Post >= spo2Pre - 2
                      ? `Saturación estable: ${spo2Pre}% → ${spo2Post}%`
                      : `Saturación bajó: ${spo2Pre}% → ${spo2Post}%. Descanse antes de levantarse.`}
                  </p>
                </div>
              )}

              {spo2Post > 0 && spo2Post < 88 && (
                <div className="mt-3 bg-red-600 text-white rounded-xl p-3 flex items-center gap-2">
                  <span className="text-xl">🚨</span>
                  <p className="font-bold text-sm">Saturación muy baja. Suba el oxígeno y descanse inmediatamente.</p>
                </div>
              )}
            </div>

            {spo2Guardado && (
              <div className="w-full bg-green-100 border-2 border-green-400 rounded-xl p-3 text-center">
                <p className="text-green-800 font-bold">✅ Registro guardado correctamente</p>
              </div>
            )}

            <button
              onClick={async () => {
                try {
                  await guardarRegistro({
                    fecha: fechaHoy(),
                    tipo: 'respiratorio',
                    datos: {
                      ejercicioId: ejercicio.id,
                      ejercicioNombre: ejercicio.nombre,
                      spo2Pre: spo2Pre || null,
                      pulsoPre: pulsoPre || null,
                      spo2Post: spo2Post || null,
                      pulsoPost: pulsoPost || null,
                      tipoRegistro: 'oxigenacion-ejercicio',
                    },
                    timestamp: Date.now(),
                  });
                  setSpo2Guardado(true);
                } catch { /* noop */ }
                onCompletado();
                speak('¡Excelente trabajo! Datos guardados. Descanse y respire con calma.');
                setTimeout(() => { setShowPost(false); }, 800);
              }}
              className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold text-lg hover:bg-green-700 active:scale-95 transition-all"
            >
              💾 Guardar y terminar
            </button>
            <button
              onClick={() => { onCompletado(); speak('Muy bien hecho. Descanse y respire con calma.'); setShowPost(false); }}
              className="w-full py-3 text-gray-500 font-semibold text-sm hover:underline"
            >
              Omitir registro y terminar
            </button>
          </div>
        ) : terminado ? (
          /* ── COMPLETADO ── */
          <div className="flex flex-col items-center gap-5 py-8 w-full">
            <div className="text-8xl animate-float-up">🎉</div>
            <h3 className="text-2xl font-black text-gray-800 text-center">¡Ejercicio completado!</h3>
            <p className="text-gray-500 text-center">Excelente trabajo. Descanse y respire con calma.</p>
            <div className="flex gap-3 w-full mt-4">
              <button onClick={reiniciar}
                className="flex-1 py-4 border-2 border-gray-200 rounded-2xl font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                ↺ Repetir
              </button>
              <button onClick={cerrar}
                className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-colors">
                Cerrar ✕
              </button>
            </div>
          </div>
        ) : !enCurso && pasoIdx === 0 ? (
          /* ── PANTALLA DE INICIO ── */
          <div className="flex flex-col items-center gap-5 py-6 w-full">
            <span className="text-7xl">{ejercicio.icono}</span>
            <p className="text-gray-700 text-center font-medium text-lg">{ejercicio.descripcionCorta}</p>
            <p className="text-gray-400 text-sm text-center">~{ejercicio.duracionMin} min · {pasos.length} pasos · voz + sonidos</p>
            {ejercicio.advertencias && ejercicio.advertencias.length > 0 && (
              <div className="w-full bg-red-50 rounded-xl p-3 border border-red-200 space-y-1">
                {ejercicio.advertencias.map((a, i) => (
                  <p key={i} className="text-red-600 text-sm flex gap-1.5"><span>⚠️</span><span>{a}</span></p>
                ))}
              </div>
            )}
            <button onClick={iniciar}
              className="w-full py-5 bg-green-600 text-white rounded-2xl text-xl font-bold hover:bg-green-700 active:scale-95 transition-all shadow-lg">
              ▶ Comenzar
            </button>
          </div>
        ) : (
          /* ── EN CURSO ── */
          <>
            {/* Panel de fase con colores y animación */}
            <div
              key={`panel-${pasoIdx}`}
              className={`phase-panel ${phasePanelClass} animate-float-up w-full`}
            >
              <p className="text-xs font-bold uppercase tracking-widest mb-2 opacity-60">{cfg.label}</p>
              <p className="text-xl font-bold text-gray-800 leading-snug">{paso.instruccion}</p>
            </div>

            {/* Círculo de respiración con animación de escala */}
            <div className="breath-circle w-48 h-48 flex-shrink-0">
              <div className={`breath-circle__ring ${cfg.ring} opacity-40 animate-pulse-ring-slow`} />
              <div className={`breath-circle__ring ${cfg.ring} opacity-55 animate-pulse-ring`} />
              <div
                key={`circle-${pasoIdx}`}
                className={`w-48 h-48 rounded-full flex flex-col items-center justify-center shadow-2xl z-10 relative ${cfg.bg} ${animCirculo}`}
              >
                <p className="text-white/80 text-xs font-bold tracking-widest uppercase">{cfg.label}</p>
                <p className="text-white text-6xl font-black tabular-nums leading-none mt-0.5">{fmtTime(seg)}</p>
                <p className="text-white/60 text-sm mt-1">seg</p>
              </div>
            </div>

            {/* Barra de progreso del paso actual */}
            <div className="w-full">
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>Paso {pasoIdx + 1} de {pasos.length}</span>
                <span>{progresoGlobal}% completado</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${cfg.bg}`}
                  style={{ width: `${progresoPaso}%` }}
                />
              </div>
            </div>

            {/* Controles */}
            <div className="flex gap-3 w-full">
              <button onClick={reiniciar}
                className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-colors text-sm">
                ↺ Reiniciar
              </button>
              {enCurso ? (
                <button onClick={pausar}
                  className="flex-[2] py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors">
                  ⏸ Pausar
                </button>
              ) : (
                <button onClick={reanudar}
                  className="flex-[2] py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors">
                  ▶ Continuar
                </button>
              )}
            </div>

            {/* Alerta saturación */}
            <div className="w-full bg-red-50 border border-red-200 rounded-xl p-2.5 flex items-center gap-2">
              <span>🚨</span>
              <p className="text-xs text-red-700 font-medium">Si la saturación baja de 88%, DETÉNGASE.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Modal Detalle ─── */
function ModalDetalle({
  ejercicio,
  onCerrar,
  onIniciar,
}: {
  ejercicio: Ejercicio;
  onCerrar: () => void;
  onIniciar: () => void;
}) {
  return (
    <div className="fixed inset-x-0 top-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] z-[60] bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col max-h-full">
        <div className="bg-green-700 px-5 py-4 flex items-center gap-3">
          <span className="text-4xl">{ejercicio.icono}</span>
          <div className="flex-1">
            <div className="flex gap-1.5 mb-0.5 flex-wrap">
              <BadgeCategoria categoria={ejercicio.categoria} />
              <BadgeDificultad dificultad={ejercicio.dificultad} />
            </div>
            <h2 className="text-white text-xl font-bold">{ejercicio.nombre}</h2>
          </div>
          <button onClick={onCerrar} className="text-white text-3xl leading-none hover:opacity-70 transition-opacity" aria-label="Cerrar">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <div className="bg-green-50 rounded-xl p-3 border border-green-200">
            <p className="text-green-800 text-sm font-medium">🎯 Beneficio</p>
            <p className="text-green-700 text-sm mt-1">{ejercicio.beneficio}</p>
          </div>

          <div className="flex gap-4 text-sm text-gray-600">
            <span>⏱️ <strong>{ejercicio.duracionMin} min</strong></span>
            <span>📊 <strong>{ejercicio.dificultad}</strong></span>
            {ejercicio.requiereAparato && <span>🔧 <strong>{ejercicio.requiereAparato}</strong></span>}
          </div>

          {ejercicio.instruccionesEstaticas?.map((seccion, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h4 className="font-bold text-gray-800 mb-2">{seccion.titulo}</h4>
              <ol className="space-y-2">
                {seccion.pasos.map((paso, j) => (
                  <li key={j} className="flex gap-2 text-sm text-gray-700">
                    <span className="font-bold text-gray-400 min-w-[1.2rem]">{j + 1}.</span>
                    <span>{paso}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}

          {ejercicio.pasos && (
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
              <p className="text-blue-700 text-sm">
                ✅ Este ejercicio tiene <strong>{ejercicio.pasos.length} pasos guiados</strong> con temporizador automático.
              </p>
            </div>
          )}

          {ejercicio.advertencias && ejercicio.advertencias.length > 0 && (
            <div className="bg-red-50 rounded-xl p-3 border border-red-200">
              <p className="text-red-700 font-bold text-sm mb-1">⚠️ Precauciones</p>
              <ul className="space-y-1">
                {ejercicio.advertencias.map((a, i) => (
                  <li key={i} className="text-red-600 text-sm flex gap-1.5">
                    <span>•</span><span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button onClick={onCerrar} className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Cerrar
          </button>
          <button onClick={onIniciar} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors">
            {ejercicio.pasos ? '▶ Iniciar guiado' : '📖 Ver instrucciones'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
   ════════════════════════════════════════════════════════════════════════════ */

export default function EjerciciosPage() {
  const [seccion, setSeccion] = useState<SeccionVista>('plan');
  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaEjercicio | 'todos'>('todos');
  const [ejercicioDetalle, setEjercicioDetalle] = useState<Ejercicio | null>(null);
  const [ejercicioGuiado, setEjercicioGuiado] = useState<Ejercicio | null>(null);
  const [ejercicioInstrucciones, setEjercicioInstrucciones] = useState<Ejercicio | null>(null);
  const [completados, setCompletados] = useState<Set<string>>(new Set());
  const [modoFatiga, setModoFatiga] = useState(false);
  const [showRecomendaciones, setShowRecomendaciones] = useState(false);
  const [pendingBloqueId, setPendingBloqueId] = useState<string | null>(null);

  // Cargar completados del día
  useEffect(() => {
    const key = `ejercicios-completados-${new Date().toISOString().slice(0, 10)}`;
    try {
      const stored = JSON.parse(localStorage.getItem(key) || '[]');
      setCompletados(new Set(stored));
    } catch { /* noop */ }
  }, []);

  function marcarCompletado(id: string) {
    const key = `ejercicios-completados-${new Date().toISOString().slice(0, 10)}`;
    const nuevo = new Set(completados);
    nuevo.add(id);
    setCompletados(nuevo);
    try { localStorage.setItem(key, JSON.stringify([...nuevo])); } catch { /* noop */ }
  }

  function handleIniciar(ejercicio: Ejercicio, bloqueId?: string) {
    setPendingBloqueId(bloqueId ?? null);
    if (ejercicio.pasos) {
      setEjercicioGuiado(ejercicio);
    } else {
      setEjercicioInstrucciones(ejercicio);
    }
    setEjercicioDetalle(null);
  }

  const ejerciciosFiltrados = categoriaFiltro === 'todos'
    ? EJERCICIOS
    : EJERCICIOS.filter((e) => e.categoria === categoriaFiltro);

  const ejercicioPorId = (id: string) => EJERCICIOS.find((e) => e.id === id);

  const diaIdx = getDiaRutinaIdx();
  const bloquesHoy = getBloquesHoy(diaIdx, modoFatiga);
  const bloquesConEjercicio = bloquesHoy.filter(b => b.ejercicioId);
  const totalPlanHoy = bloquesConEjercicio.length;
  const completadosHoy = bloquesConEjercicio.filter(b => completados.has(b.bloqueId)).length;
  const rutinaDiaHoy = RUTINA_SEMANAL[diaIdx];

  return (
    <>
      <Header titulo="🏃 Ejercicios" />

      <main className="max-w-3xl mx-auto px-4 pb-32 pt-4 space-y-4">

        {/* ── Progreso del día ── */}
        <Card color="green">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-green-800 font-bold text-lg">Progreso de hoy</p>
              <p className="text-green-600 text-sm">{completadosHoy} de {totalPlanHoy} ejercicios completados</p>
            </div>
            <span className="text-4xl">{completadosHoy === totalPlanHoy && totalPlanHoy > 0 ? '🏆' : '💪'}</span>
          </div>
          <div className="w-full bg-green-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-green-600 h-full rounded-full transition-all duration-500"
              style={{ width: totalPlanHoy > 0 ? `${(completadosHoy / totalPlanHoy) * 100}%` : '0%' }}
            />
          </div>
        </Card>

        {/* ── Selector de sección ── */}
        <div className="flex rounded-xl overflow-hidden border-2 border-gray-200">
          {(['plan', 'biblioteca'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSeccion(s)}
              className={`flex-1 py-3 font-bold text-sm transition-colors ${
                seccion === s ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s === 'plan' ? '📅 Rutina Semanal' : '📚 Biblioteca'}
            </button>
          ))}
        </div>

        {/* ════ SECCIÓN: RUTINA SEMANAL ════ */}
        {seccion === 'plan' && (
          <div className="space-y-4">

            {/* Regla de Oro — Toggle de fatiga */}
            <div className={`rounded-2xl p-4 border-2 transition-colors ${modoFatiga ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-sm">Regla de Oro</p>
                  <p className="text-xs text-gray-500">¿Más fatigado de lo habitual? Solo haz la parte respiratoria.</p>
                </div>
                <button
                  onClick={() => setModoFatiga(!modoFatiga)}
                  className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 ${modoFatiga ? 'bg-amber-500' : 'bg-gray-300'}`}
                  aria-label="Activar modo fatiga"
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${modoFatiga ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>

            {/* Calendario semanal */}
            <div className="bg-white rounded-2xl p-4 border-2 border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-700 mb-3">📅 Semana</h3>
              <div className="flex gap-1.5">
                {RUTINA_SEMANAL.map((dia, idx) => {
                  const esHoy = idx === diaIdx;
                  return (
                    <div
                      key={idx}
                      className={`flex-1 py-2 px-1 rounded-xl text-center transition-colors ${esHoy ? 'bg-green-600 text-white ring-2 ring-green-400' : 'bg-gray-50 text-gray-600'}`}
                    >
                      <p className={`text-xs font-bold ${esHoy ? 'text-white' : ''}`}>{dia.nombreCorto}</p>
                      <p className={`text-[10px] mt-0.5 leading-tight ${esHoy ? 'text-green-100' : 'text-gray-400'}`}>{dia.intensidad}</p>
                    </div>
                  );
                })}
              </div>
              {/* Actividad de hoy */}
              <div className="mt-3 bg-green-50 rounded-xl p-3 border border-green-200">
                <p className="text-xs text-green-600 font-semibold">HOY — {rutinaDiaHoy.nombre}</p>
                <p className="text-sm text-green-800 font-bold mt-0.5">{rutinaDiaHoy.actividad}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${rutinaDiaHoy.colorIntensidad}`}>
                  Intensidad: {rutinaDiaHoy.intensidad}
                </span>
              </div>
            </div>

            {/* Cronograma del día */}
            <div className="bg-white rounded-2xl p-4 border-2 border-gray-200 shadow-sm">
              <h3 className="text-base font-bold text-gray-700 mb-3">🕐 Cronograma de Hoy</h3>
              <div className="space-y-2">
                {bloquesHoy.map((bloque, idx) => {
                  const ejObj = bloque.ejercicioId ? ejercicioPorId(bloque.ejercicioId) : null;
                  const hecho = completados.has(bloque.bloqueId);
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 rounded-xl p-3 border-2 transition-colors ${
                        hecho
                          ? 'border-green-300 bg-green-50'
                          : bloque.tipo === 'comida'
                            ? 'border-orange-200 bg-orange-50'
                            : bloque.tipo === 'info'
                              ? 'border-gray-200 bg-gray-50'
                              : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="text-center flex-shrink-0 w-12">
                        <p className="text-xs font-bold text-gray-500">{bloque.hora}</p>
                        <span className="text-xl">{bloque.icono}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${hecho ? 'text-green-700 line-through' : 'text-gray-800'}`}>{bloque.nombre}</p>
                        <p className="text-xs text-gray-500 truncate">{bloque.objetivo}</p>
                        {bloque.duracion && <p className="text-xs text-gray-400 mt-0.5">⏱️ {bloque.duracion}</p>}
                      </div>
                      <div className="flex-shrink-0">
                        {hecho ? (
                          <span className="text-green-600 text-lg">✅</span>
                        ) : ejObj ? (
                          <button
                            onClick={() => handleIniciar(ejObj, bloque.bloqueId)}
                            className="py-1.5 px-3 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                          >
                            ▶ Guiar
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recomendaciones (colapsable) */}
            <div className="bg-white rounded-2xl p-4 border-2 border-gray-200 shadow-sm">
              <button onClick={() => setShowRecomendaciones(!showRecomendaciones)} className="flex items-center justify-between w-full">
                <h3 className="text-base font-bold text-gray-700">💡 Recomendaciones</h3>
                <span className="text-gray-400">{showRecomendaciones ? '▲' : '▼'}</span>
              </button>
              {showRecomendaciones && (
                <div className="mt-3 space-y-3">
                  {RECOMENDACIONES.map((r, i) => (
                    <div key={i} className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                      <p className="text-sm font-bold text-blue-800">{r.icono} {r.titulo}</p>
                      <p className="text-sm text-blue-700 mt-1">{r.texto}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════ SECCIÓN: BIBLIOTECA ════ */}
        {seccion === 'biblioteca' && (
          <div className="space-y-4">
            {/* Filtro por categoría */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(['todos', 'respiratorio', 'aparatos', 'movilidad'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoriaFiltro(cat)}
                  className={`flex-shrink-0 py-1.5 px-4 rounded-full text-sm font-semibold border-2 transition-colors ${
                    categoriaFiltro === cat
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {cat === 'todos' ? 'Todos' : CATEGORIA_LABEL[cat]}
                </button>
              ))}
            </div>

            {/* Lista de ejercicios */}
            {ejerciciosFiltrados.map((ejercicio) => (
              <TarjetaEjercicio
                key={ejercicio.id}
                ejercicio={ejercicio}
                onIniciar={handleIniciar}
                onVerDetalle={setEjercicioDetalle}
              />
            ))}
          </div>
        )}
      </main>

      {/* ════ MODALES ════ */}
      {ejercicioDetalle && (
        <ModalDetalle
          ejercicio={ejercicioDetalle}
          onCerrar={() => setEjercicioDetalle(null)}
          onIniciar={() => handleIniciar(ejercicioDetalle)}
        />
      )}

      {ejercicioGuiado && (
        <ModalGuiado
          ejercicio={ejercicioGuiado}
          onCerrar={() => setEjercicioGuiado(null)}
          onCompletado={() => marcarCompletado(pendingBloqueId ?? ejercicioGuiado.id)}
        />
      )}

      {ejercicioInstrucciones && (
        <ModalInstrucciones
          ejercicio={ejercicioInstrucciones}
          onCerrar={() => setEjercicioInstrucciones(null)}
        />
      )}
    </>
  );
}
