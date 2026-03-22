'use client';

import { useState, useCallback, useEffect } from 'react';
import Header from '@/components/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import NumberInput from '@/components/ui/NumberInput';
import ToggleInput from '@/components/ui/ToggleInput';
import AlertBanner from '@/components/ui/AlertBanner';
import { guardarRegistro, fechaHoy } from '@/lib/db';
import { evaluarPeso, evaluarPresion, evaluarFrecuenciaCardiaca, procesarAlerta } from '@/lib/rules';

export default function CardiorrenalPage() {
  // Peso de referencia del usuario: cargar de localStorage y por defecto 55 kg
  const [peso, setPesoState] = useState<number>(55);
  const setPeso = (v: number) => {
    setPesoState(v);
    try {
      localStorage.setItem('userPeso', String(v));
    } catch (e) {
      // ignore
    }
  };
  const [sistolica, setSistolica] = useState(120);
  const [diastolica, setDiastolica] = useState(80);
  const [fc, setFc] = useState(72);
  const [hinchazon, setHinchazon] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [alertas, setAlertas] = useState<string[]>([]);

  const guardarRegistroDatos = useCallback(async () => {
    const nuevasAlertas: string[] = [];

    const resPeso = await evaluarPeso(peso);
    if (resPeso) {
      await procesarAlerta(resPeso);
      nuevasAlertas.push(resPeso.mensaje);
    }

    const resPresion = evaluarPresion(sistolica, diastolica);
    if (resPresion) {
      await procesarAlerta(resPresion);
      nuevasAlertas.push(resPresion.mensaje);
    }

    const resFc = evaluarFrecuenciaCardiaca(fc);
    if (resFc) {
      await procesarAlerta(resFc);
      nuevasAlertas.push(resFc.mensaje);
    }

    if (hinchazon) {
      nuevasAlertas.push('Ha reportado hinchazón. Vigile la retención de líquidos y consulte a su médico si persiste.');
    }

    setAlertas(nuevasAlertas);

    await guardarRegistro({
      fecha: fechaHoy(),
      tipo: 'cardiorrenal',
      datos: { peso, sistolica, diastolica, fc, hinchazon },
      timestamp: Date.now(),
    });
    setGuardado(true);
  }, [peso, sistolica, diastolica, fc, hinchazon]);

  // On mount: load stored reference weight if exists
  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('userPeso') : null;
      if (stored) {
        const n = Number(stored);
        if (!Number.isNaN(n)) setPesoState(n);
      } else {
        // initialize default 55 kg
        if (typeof window !== 'undefined') localStorage.setItem('userPeso', '55');
        setPesoState(55);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  return (
    <>
      <Header titulo="❤️ Corazón y Riñón" mostrarVolver />
      <div className="p-4 space-y-4">
        <Card icon="📋" title="Registro diario" color="red">
          <p className="text-gray-600 text-lg">
            Registre sus signos vitales de hoy. Es importante hacerlo todos los días a la misma hora.
          </p>
        </Card>

        {alertas.map((msg, i) => (
          <AlertBanner key={i} tipo="advertencia" mensaje={msg} />
        ))}

        <Card color="white">
          <NumberInput
            label="⚖️ Peso"
            value={peso}
            onChange={setPeso}
            min={30}
            max={200}
            step={0.01}
            unit="kg"
          />
        </Card>

        <Card color="white">
          <h3 className="text-lg font-bold text-gray-700 mb-3">🩺 Presión Arterial</h3>
          <NumberInput
            label="Sistólica (número alto)"
            value={sistolica}
            onChange={setSistolica}
            min={60}
            max={250}
            unit="mmHg"
          />
          <NumberInput
            label="Diastólica (número bajo)"
            value={diastolica}
            onChange={setDiastolica}
            min={40}
            max={150}
            unit="mmHg"
          />
        </Card>

        <Card color="white">
          <NumberInput
            label="💓 Frecuencia Cardíaca"
            value={fc}
            onChange={setFc}
            min={30}
            max={200}
            unit="lpm"
          />
        </Card>

        <Card color="white">
          <ToggleInput
            label="🦶 ¿Tiene hinchazón hoy? (pies, tobillos, piernas)"
            value={hinchazon}
            onChange={setHinchazon}
          />
        </Card>

        {guardado ? (
          <AlertBanner tipo="exito" mensaje="Registro cardiorrenal guardado correctamente" />
        ) : (
          <Button fullWidth onClick={guardarRegistroDatos}>
            💾 Guardar Registro del Día
          </Button>
        )}
      </div>
    </>
  );
}
