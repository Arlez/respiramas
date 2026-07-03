'use client';

import { useEffect } from 'react';
import { registrarServiceWorker, solicitarPermisoNotificaciones, iniciarRecordatoriosFijos } from '@/lib/notifications';
import { esPlataformaCapacitor } from '@/services/alarmService';

export default function PWARegister() {
  useEffect(() => {
    async function init() {
      await registrarServiceWorker();

      if (esPlataformaCapacitor()) {
        await solicitarPermisoNotificaciones();
        iniciarRecordatoriosFijos();
      }
    }
    init();
  }, []);

  return null;
}
