'use client';

import { useState, useCallback } from 'react';
import Header from '@/components/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SliderInput from '@/components/ui/SliderInput';
import ToggleInput from '@/components/ui/ToggleInput';
import AlertBanner from '@/components/ui/AlertBanner';
import { guardarRegistro, fechaHoy } from '@/lib/db';
import historyLib from '@/lib/history';
import { evaluarFatiga, procesarAlerta } from '@/lib/rules';

export default function EnergiaPage() {
  const [fatiga, setFatiga] = useState(3);
  const [mareos, setMareos] = useState(false);
  const [toleranciaEsfuerzo, setToleranciaEsfuerzo] = useState(5);
  const [guardado, setGuardado] = useState(false);
  const [alerta, setAlerta] = useState<string | null>(null);

  const guardarRegistroDatos = useCallback(async () => {
    const resFatiga = evaluarFatiga(fatiga);
    if (resFatiga) {
      await procesarAlerta(resFatiga);
      setAlerta(resFatiga.mensaje);
    }

    if (mareos && fatiga > 5) {
      setAlerta('Presenta mareos y fatiga alta. Si persiste, consulte a su médico. Puede ser señal de anemia.');
    }

    await guardarRegistro({
      fecha: fechaHoy(),
      tipo: 'energia',
      datos: { fatiga, mareos, toleranciaEsfuerzo },
      timestamp: Date.now(),
    });
    try {
      await historyLib.addHistory('energia registrada', { fatiga, mareos, toleranciaEsfuerzo, fecha: fechaHoy() });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('No se pudo guardar historial energia:', e);
    }
    setGuardado(true);
  }, [fatiga, mareos, toleranciaEsfuerzo]);

  return (
    <>
      <Header titulo="⚡ Energía" mostrarVolver />
      <div className="p-4 space-y-4">
        <Card icon="🩸" title="Control de anemia" color="purple">
          <p className="text-gray-600 text-lg">
            Registre cómo se siente hoy. La anemia causa cansancio y mareos. Llevar un registro ayuda a su médico.
          </p>
        </Card>

        {alerta && <AlertBanner tipo="advertencia" mensaje={alerta} onClose={() => setAlerta(null)} />}

        <Card color="white">
          <SliderInput
            label="😴 Nivel de fatiga / cansancio"
            value={fatiga}
            onChange={setFatiga}
            min={1}
            max={10}
          />
          <p className="text-sm text-gray-500">
            1 = Con energía · 10 = Extremadamente cansado
          </p>
        </Card>

        <Card color="white">
          <ToggleInput
            label="💫 ¿Ha tenido mareos hoy?"
            value={mareos}
            onChange={setMareos}
          />
        </Card>

        <Card color="white">
          <SliderInput
            label="🏃 Tolerancia al esfuerzo"
            value={toleranciaEsfuerzo}
            onChange={setToleranciaEsfuerzo}
            min={1}
            max={10}
          />
          <p className="text-sm text-gray-500">
            1 = No tolero nada · 10 = Tolero bien el esfuerzo
          </p>
        </Card>

        <Card icon="💡" color="yellow">
          <p className="text-gray-700 font-medium">
            Consejo: Alimentos ricos en hierro (espinaca, lentejas, huevo) ayudan a combatir la anemia.
            Vaya al módulo de Nutrición para ver recetas recomendadas.
          </p>
        </Card>

        {guardado ? (
          <AlertBanner tipo="exito" mensaje="Registro de energía guardado correctamente" />
        ) : (
          <Button fullWidth onClick={guardarRegistroDatos}>
            💾 Guardar Registro
          </Button>
        )}
      </div>
    </>
  );
}
