'use client';

import { useEffect } from 'react';
import { sincronizarHorariosCatalogo, deduplicarMedicamentos } from '@/lib/db';

export default function MigrateMedTimes() {
  useEffect(() => {
    // Ejecutar una sola vez por cliente para no tocar la DB repetidamente
    try {
      const flag = localStorage.getItem('migrated_med_times');
      if (flag === '1') return;
      (async () => {
        try {
          // primero deduplicar entradas en DB
          await deduplicarMedicamentos();
          // luego sincronizar horarios desde el catálogo
          await sincronizarHorariosCatalogo();
          localStorage.setItem('migrated_med_times', '1');
        } catch (e) {
          // noop
        }
      })();
    } catch (e) {
      // noop
    }
  }, []);

  return null;
}
