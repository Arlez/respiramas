'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import {
  Ejercicio,
  EJERCICIOS,
  TarjetaEjercicio,
  ModalGuiado,
  ModalDetalle,
  ModalInstrucciones,
} from './_shared';

export default function EjerciciosPage() {
  const [ejercicioDetalle, setEjercicioDetalle] = useState<Ejercicio | null>(null);
  const [ejercicioGuiado, setEjercicioGuiado] = useState<Ejercicio | null>(null);
  const [ejercicioInstrucciones, setEjercicioInstrucciones] = useState<Ejercicio | null>(null);

  function handleIniciar(ejercicio: Ejercicio) {
    if (ejercicio.pasos) {
      setEjercicioGuiado(ejercicio);
    } else {
      setEjercicioInstrucciones(ejercicio);
    }
    setEjercicioDetalle(null);
  }

  return (
    <>
      <Header titulo="💪 Ejercicios" />

      <main className="max-w-3xl mx-auto px-4 pb-32 pt-4 space-y-3">
        <p className="text-gray-500 text-base">Selecciona cualquier ejercicio para realizarlo las veces que quieras.</p>

        {EJERCICIOS.map((ejercicio) => (
          <TarjetaEjercicio
            key={ejercicio.id}
            ejercicio={ejercicio}
            onIniciar={handleIniciar}
            onVerDetalle={setEjercicioDetalle}
          />
        ))}
      </main>

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
          onCompletado={() => setEjercicioGuiado(null)}
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
