// Sistema de notificaciones para Vivir Mejor
// Maneja permisos, registro del SW y envío de notificaciones locales

export async function registrarServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    return registration;
  } catch (error) {
    console.error('Error registrando Service Worker:', error);
    return null;
  }
}

export async function solicitarPermisoNotificaciones(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;

  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const permiso = await Notification.requestPermission();
  return permiso === 'granted';
}

export async function enviarNotificacionLocal(
  titulo: string,
  cuerpo: string,
  tag: string = 'general'
): Promise<void> {
  const permitido = await solicitarPermisoNotificaciones();
  if (!permitido) return;

  const registration = await navigator.serviceWorker?.ready;
  if (registration) {
    registration.showNotification(titulo, {
      body: cuerpo,
      icon: '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
      tag,
      requireInteraction: true,
    } as NotificationOptions);
  }
}

// Sistema de recordatorios programados usando setTimeout
// En producción se usaría la Notification Triggers API o un backend

interface Recordatorio {
  id: string;
  titulo: string;
  cuerpo: string;
  tag: string;
  horario: string; // "HH:MM"
  timerId?: ReturnType<typeof setTimeout>;
}

const recordatoriosActivos = new Map<string, Recordatorio>();

export function programarRecordatorioDiario(
  id: string,
  titulo: string,
  cuerpo: string,
  horario: string,
  tag: string = 'general'
): void {
  cancelarRecordatorio(id);

  const programar = () => {
    const ahora = new Date();
    const [horas, minutos] = horario.split(':').map(Number);
    const objetivo = new Date();
    objetivo.setHours(horas, minutos, 0, 0);

    // Si la hora ya pasó hoy, programar para mañana
    if (objetivo.getTime() <= ahora.getTime()) {
      objetivo.setDate(objetivo.getDate() + 1);
    }

    const delay = objetivo.getTime() - ahora.getTime();

    const timerId = setTimeout(() => {
      enviarNotificacionLocal(titulo, cuerpo, tag);
      // Re-programar para el día siguiente
      programar();
    }, delay);

    recordatoriosActivos.set(id, { id, titulo, cuerpo, tag, horario, timerId });
  };

  programar();
}

export function cancelarRecordatorio(id: string): void {
  const rec = recordatoriosActivos.get(id);
  if (rec?.timerId) {
    clearTimeout(rec.timerId);
    recordatoriosActivos.delete(id);
  }
}

export function cancelarTodosLosRecordatorios(): void {
  recordatoriosActivos.forEach((rec) => {
    if (rec.timerId) clearTimeout(rec.timerId);
  });
  recordatoriosActivos.clear();
}

// Programar recordatorios fijos de la app
export function iniciarRecordatoriosFijos(): void {
  programarRecordatorioDiario(
    'ejercicio-manana',
    '🫁 Hora de respirar',
    'Es momento de tu ejercicio respiratorio matutino',
    '09:00',
    'respiratorio'
  );

  programarRecordatorioDiario(
    'ejercicio-tarde',
    '🚶 Caminata suave',
    'Hora de tu caminata por intervalos',
    '17:00',
    'ejercicio'
  );

  programarRecordatorioDiario(
    'registro-noche',
    '📊 Registro diario',
    '¿Ya registraste tu peso, presión y cómo te sientes?',
    '20:00',
    'registro'
  );
}
