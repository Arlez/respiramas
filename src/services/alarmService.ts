import { LocalNotifications, PermissionStatus } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export function esPlataformaCapacitor(): boolean {
  return Capacitor.isNativePlatform();
}

export function stringToNumberId(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

const CHANNEL_ID = 'respiramas-alarmas';
const CHANNEL_NAME = 'Recordatorios Respiramas';
const CHANNEL_DESC = 'Alarmas y recordatorios del plan diario';

let permisosConcedidos = false;
let canalCreado = false;

async function asegurarCanal(): Promise<void> {
  if (canalCreado) return;
  if (Capacitor.isNativePlatform()) {
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: CHANNEL_NAME,
      description: CHANNEL_DESC,
      importance: 5,
      visibility: 1,
      sound: undefined,
      lights: true,
      vibration: true,
    });
  }
  canalCreado = true;
}

export async function solicitarPermisosAlarmas(): Promise<boolean> {
  if (permisosConcedidos) return true;
  if (!Capacitor.isNativePlatform()) return true;

  let status: PermissionStatus = await LocalNotifications.checkPermissions();

  if (status.display !== 'granted') {
    status = await LocalNotifications.requestPermissions();
  }

  permisosConcedidos = status.display === 'granted';

  if (permisosConcedidos) {
    await asegurarCanal();
  }

  return permisosConcedidos;
}

export async function programarAlarmaNativa(
  id: number,
  titulo: string,
  mensaje: string,
  fecha: Date,
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const permitido = await solicitarPermisosAlarmas();
  if (!permitido) return;

  await LocalNotifications.schedule({
    notifications: [
      {
        id,
        title: titulo,
        body: mensaje,
        schedule: { at: fecha, allowWhileIdle: true },
        channelId: CHANNEL_ID,
        extra: { id, titulo },
      },
    ],
  });
}

export async function cancelarAlarma(id: number): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await LocalNotifications.cancel({ notifications: [{ id }] });
}

export async function cancelarTodasLasAlarmas(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const pendientes = await LocalNotifications.getPending();
  if (pendientes.notifications.length > 0) {
    await LocalNotifications.cancel(pendientes);
  }
}

export async function reprogramarAlarmasDelDia(
  bloques: Array<{ bloqueId: string; hora: string; nombre: string; objetivo: string }>,
  completados: Set<string>,
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const permitido = await solicitarPermisosAlarmas();
  if (!permitido) return;

  const ahora = new Date();

  for (const bloque of bloques) {
    if (completados.has(bloque.bloqueId)) continue;

    const [h, m] = bloque.hora.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) continue;

    const fechaAlarma = new Date(ahora);
    fechaAlarma.setHours(h, m, 0, 0);

    if (fechaAlarma.getTime() <= ahora.getTime()) continue;

    const idNum = stringToNumberId(bloque.bloqueId);
    await programarAlarmaNativa(idNum, bloque.nombre, bloque.objetivo, fechaAlarma);
  }
}

export async function enviarNotificacionInmediata(
  titulo: string,
  cuerpo: string,
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const permitido = await solicitarPermisosAlarmas();
  if (!permitido) return;

  await LocalNotifications.schedule({
    notifications: [
      {
        id: Date.now(),
        title: titulo,
        body: cuerpo,
        schedule: { at: new Date(Date.now() + 500) },
        channelId: CHANNEL_ID,
      },
    ],
  });
}
