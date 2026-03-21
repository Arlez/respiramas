// Motor de reglas de alerta clínica para Vivir Mejor
// Evalúa métricas y genera alertas automáticas

import { crearAlerta, fechaHoy, obtenerRegistrosPorTipo, type RegistroDiario } from './db';
import { enviarNotificacionLocal } from './notifications';

export interface ResultadoRegla {
  tipo: 'critica' | 'advertencia' | 'info';
  mensaje: string;
  modulo: string;
}

// --- Reglas de SpO2 ---
export function evaluarSpO2(valor: number): ResultadoRegla | null {
  if (valor < 88) {
    return {
      tipo: 'critica',
      mensaje: `⚠️ SpO2 muy baja (${valor}%). DETENGA el ejercicio. Siéntese y respire lentamente. Si persiste, contacte a su médico.`,
      modulo: 'respiratorio',
    };
  }
  if (valor < 92) {
    return {
      tipo: 'advertencia',
      mensaje: `SpO2 baja (${valor}%). Reduzca la intensidad y descanse.`,
      modulo: 'respiratorio',
    };
  }
  return null;
}

// --- Reglas de fatiga ---
export function evaluarFatiga(valor: number): ResultadoRegla | null {
  if (valor > 7) {
    return {
      tipo: 'advertencia',
      mensaje: `Fatiga alta (${valor}/10). Se reduce automáticamente la intensidad. Considere descansar.`,
      modulo: 'ejercicio',
    };
  }
  if (valor > 5) {
    return {
      tipo: 'info',
      mensaje: `Fatiga moderada (${valor}/10). Vaya a su ritmo, escuche su cuerpo.`,
      modulo: 'ejercicio',
    };
  }
  return null;
}

// --- Reglas de peso (aumento rápido → retención de líquidos) ---
export async function evaluarPeso(pesoActual: number): Promise<ResultadoRegla | null> {
  const registros = await obtenerRegistrosPorTipo('cardiorrenal');
  const últimos = registros
    .filter((r) => r.datos.peso !== undefined)
    .sort((a, b) => b.timestamp - a.timestamp);

  if (últimos.length < 2) return null;

  const pesoAnterior = últimos[0].datos.peso as number;
  const diferencia = pesoActual - pesoAnterior;

  if (diferencia >= 2) {
    return {
      tipo: 'critica',
      mensaje: `⚠️ Aumento de peso rápido (+${diferencia.toFixed(1)} kg). Puede ser retención de líquidos. Consulte a su médico.`,
      modulo: 'cardiorrenal',
    };
  }
  if (diferencia >= 1) {
    return {
      tipo: 'advertencia',
      mensaje: `Aumento de peso de +${diferencia.toFixed(1)} kg. Vigile su ingesta de líquidos y sal.`,
      modulo: 'cardiorrenal',
    };
  }
  return null;
}

// --- Reglas de presión arterial ---
export function evaluarPresion(sistolica: number, diastolica: number): ResultadoRegla | null {
  if (sistolica > 180 || diastolica > 120) {
    return {
      tipo: 'critica',
      mensaje: `⚠️ Presión muy alta (${sistolica}/${diastolica}). Busque atención médica.`,
      modulo: 'cardiorrenal',
    };
  }
  if (sistolica > 140 || diastolica > 90) {
    return {
      tipo: 'advertencia',
      mensaje: `Presión elevada (${sistolica}/${diastolica}). Descanse y repita la medición en 15 minutos.`,
      modulo: 'cardiorrenal',
    };
  }
  if (sistolica < 90 || diastolica < 60) {
    return {
      tipo: 'advertencia',
      mensaje: `Presión baja (${sistolica}/${diastolica}). Siéntese, beba agua lentamente.`,
      modulo: 'cardiorrenal',
    };
  }
  return null;
}

// --- Reglas de frecuencia cardíaca ---
export function evaluarFrecuenciaCardiaca(fc: number): ResultadoRegla | null {
  if (fc > 120) {
    return {
      tipo: 'critica',
      mensaje: `⚠️ Frecuencia cardíaca alta (${fc} lpm). Detenga la actividad y descanse.`,
      modulo: 'cardiorrenal',
    };
  }
  if (fc < 50) {
    return {
      tipo: 'advertencia',
      mensaje: `Frecuencia cardíaca baja (${fc} lpm). Consulte a su médico si tiene mareos.`,
      modulo: 'cardiorrenal',
    };
  }
  return null;
}

// --- Evaluador general ---
export async function procesarAlerta(resultado: ResultadoRegla | null): Promise<void> {
  if (!resultado) return;

  // Guardar en DB
  await crearAlerta({
    tipo: resultado.tipo,
    mensaje: resultado.mensaje,
    modulo: resultado.modulo,
    fecha: fechaHoy(),
    leida: false,
    timestamp: Date.now(),
  });

  // Notificación push inmediata para alertas críticas
  if (resultado.tipo === 'critica') {
    await enviarNotificacionLocal('⚠️ Alerta Crítica', resultado.mensaje, resultado.modulo);
  }
}

// Calcula intensidad recomendada de ejercicio basada en métricas recientes
export async function calcularIntensidadRecomendada(): Promise<'normal' | 'reducida' | 'reposo'> {
  const registros = await obtenerRegistrosPorTipo('ejercicio');
  const últimos = registros.sort((a, b) => b.timestamp - a.timestamp).slice(0, 3);

  if (últimos.length === 0) return 'normal';

  const fatigaPromedio = últimos.reduce((acc, r) => acc + ((r.datos.fatiga as number) || 0), 0) / últimos.length;
  const últimaSpO2 = últimos[0]?.datos.spo2Min as number;

  if (últimaSpO2 && últimaSpO2 < 88) return 'reposo';
  if (fatigaPromedio > 7) return 'reducida';
  if (fatigaPromedio > 5) return 'reducida';

  return 'normal';
}
