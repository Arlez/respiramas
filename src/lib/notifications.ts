import { obtenerRecordatoriosConfig, obtenerMedicamentos, eliminarRecordatorioConfig } from './db';
import {
  solicitarPermisosAlarmas,
  programarAlarmaNativa,
  cancelarAlarma,
  cancelarTodasLasAlarmas,
  enviarNotificacionInmediata,
  stringToNumberId,
} from '@/services/alarmService';

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
  return solicitarPermisosAlarmas();
}

export async function enviarNotificacionLocal(
  titulo: string,
  cuerpo: string,
  _tag: string = 'general'
): Promise<void> {
  await enviarNotificacionInmediata(titulo, cuerpo);
}

export function programarRecordatorioDiario(
  id: string,
  titulo: string,
  cuerpo: string,
  horario: string,
  _tag: string = 'general'
): void {
  const [horas, minutos] = horario.split(':').map(Number);
  if (isNaN(horas) || isNaN(minutos)) return;

  const ahora = new Date();
  const objetivo = new Date();
  objetivo.setHours(horas, minutos, 0, 0);

  if (objetivo.getTime() <= ahora.getTime()) {
    objetivo.setDate(objetivo.getDate() + 1);
  }

  const idNum = stringToNumberId(id);
  programarAlarmaNativa(idNum, titulo, cuerpo, objetivo);
}

export function cancelarRecordatorio(id: string): void {
  const idNum = stringToNumberId(id);
  cancelarAlarma(idNum);
}

export function cancelarTodosLosRecordatorios(): void {
  cancelarTodasLasAlarmas();
}

function cancelarRecordatoriosMedicacion() {
  cancelarTodasLasAlarmas();
}

export async function programarRecordatoriosMedicacion(): Promise<void> {
  try {
    const meds = await obtenerMedicamentos();
    if (!meds || meds.length === 0) return;

    meds.forEach((m) => {
      if (!m.activo) return;
      const horarios: string[] = Array.isArray(m.horarios) ? m.horarios : [];
      horarios.forEach((h) => {
        const id = `med-${m.id}-${h.replace(':', '')}`;
        const titulo = `💊 ${m.nombre}`;
        let cuerpo = `${m.dosis || ''}`;
        if (m.frecuencia === 'every_other_day') cuerpo += ' · (día por medio)';
        if (m.proposito) cuerpo += ` · ${m.proposito}`;
        programarRecordatorioDiario(id, titulo, cuerpo, h, 'medicacion');
      });
    });
  } catch (e) {
    // no bloquear
  }
}

export async function iniciarRecordatoriosFijos(): Promise<void> {
  try {
    await limpiarDefaultsAntiguos();

    const configs = await obtenerRecordatoriosConfig();
    if (!configs || configs.length === 0) return;

    configs.forEach((c: any) => {
      if (c.activo) {
        programarRecordatorioDiario(c.id, c.titulo, c.cuerpo, c.horario, c.tag ?? 'general');
      } else {
        cancelarRecordatorio(c.id);
      }
    });

    try {
      await programarRecordatoriosMedicacion();
    } catch (e) {
      // noop
    }
  } catch (e) {
    // noop
  }
}

const DEFAULTS_LIMPIEZA_KEY = 'respiramas-defaults-limpiados';

async function limpiarDefaultsAntiguos(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    if (localStorage.getItem(DEFAULTS_LIMPIEZA_KEY) === 'v1') return;

    const idsAntiguos = ['ejercicio-manana', 'ejercicio-tarde', 'registro-noche'];
    for (const id of idsAntiguos) {
      try {
        await eliminarRecordatorioConfig(id);
        cancelarRecordatorio(id);
      } catch (e) {
        // puede que no exista
      }
    }

    localStorage.setItem(DEFAULTS_LIMPIEZA_KEY, 'v1');
  } catch (e) {
    // noop
  }
}
