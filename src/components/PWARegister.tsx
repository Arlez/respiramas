'use client';

import { useEffect } from 'react';
import { registrarServiceWorker, solicitarPermisoNotificaciones, iniciarRecordatoriosFijos } from '@/lib/notifications';

export default function PWARegister() {
  useEffect(() => {
    async function init() {
      const registration = await registrarServiceWorker();
      if (registration) {
        const permitido = await solicitarPermisoNotificaciones();
        if (permitido) {
          iniciarRecordatoriosFijos();
        }
      }
    }
    init();
  }, []);

  return null;
}
