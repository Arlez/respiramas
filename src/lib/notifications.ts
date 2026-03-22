// Sistema de notificaciones para Respira Más
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
import { obtenerRecordatoriosConfig, guardarRecordatorioConfig } from './db';

export async function iniciarRecordatoriosFijos(): Promise<void> {
  try {
    const configs = await obtenerRecordatoriosConfig();
    // Si no hay configs en DB, sembrar los valores por defecto
    if (!configs || configs.length === 0) {
      const defaults = [
        { id: 'ejercicio-manana', titulo: '🫁 Hora de respirar', cuerpo: 'Es momento de tu ejercicio respiratorio matutino', horario: '09:00', tag: 'respiratorio', activo: true },
        { id: 'ejercicio-tarde', titulo: '🚶 Caminata suave', cuerpo: 'Hora de tu caminata por intervalos', horario: '17:00', tag: 'ejercicio', activo: true },
        { id: 'registro-noche', titulo: '📊 Registro diario', cuerpo: '¿Ya registraste tu peso, presión y cómo te sientes?', horario: '20:00', tag: 'registro', activo: true },
      ];
      for (const d of defaults) {
        try { await guardarRecordatorioConfig(d as any); } catch (e) { /* ignore */ }
      }
    }

    const finalConfigs = await obtenerRecordatoriosConfig();
    // Programar cada recordatorio activo
    finalConfigs.forEach((c) => {
      if (c.activo) {
        programarRecordatorioDiario(c.id, c.titulo, c.cuerpo, c.horario, c.tag ?? 'general');
      } else {
        cancelarRecordatorio(c.id);
      }
    });
  } catch (e) {
    // si algo falla, mantener comportamiento antiguo (no bloquear)
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
}
