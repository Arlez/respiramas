// Catálogo de medicamentos clínicos para Respiramas
// Permite agregar medicamentos rápidamente con datos precargados

export type Frecuencia = 'daily' | 'every_other_day';

export type MedicamentoCatalogo = {
  catalogoId: string;
  nombre: string;
  nombreGenerico?: string;
  categoria: string;
  dosis: string;
  horariosPredeterminados: string[];
  frecuencia: Frecuencia;
  instrucciones?: string;
  proposito: string;
  advertencias?: string[];
  efectosSecundarios?: string[];
};

export const catalogoMedicamentos: MedicamentoCatalogo[] = [
  {
    catalogoId: 'prednisona',
    nombre: 'Prednisona',
    categoria: 'Corticoide',
    dosis: '10 mg',
    horariosPredeterminados: ['08:00'],
    frecuencia: 'daily',
    proposito: 'Disminuir inflamación pulmonar',
    advertencias: [
      'Aumenta fragilidad de la piel',
      'Puede elevar glicemia',
      'Mayor riesgo de infecciones',
    ],
    efectosSecundarios: ['Retención de líquidos', 'Moretones', 'Debilidad muscular'],
  },
  {
    catalogoId: 'rivaroxaban',
    nombre: 'Rivaroxabán',
    categoria: 'Anticoagulante',
    dosis: '15 mg',
    horariosPredeterminados: ['08:00'],
    frecuencia: 'daily',
    proposito: 'Prevenir formación de coágulos',
    advertencias: [
      'Alto riesgo de sangrado',
      'Evitar golpes',
      'No combinar con antiinflamatorios sin indicación',
    ],
    efectosSecundarios: ['Moretones', 'Sangrado nasal o encías'],
  },
  {
    catalogoId: 'rosuvastatina',
    nombre: 'Rosuvastatina',
    categoria: 'Estatina',
    dosis: '10 mg',
    horariosPredeterminados: ['08:00'],
    frecuencia: 'daily',
    proposito: 'Reducir colesterol LDL',
    advertencias: ['Controlar dolor muscular', 'Evitar alcohol excesivo'],
    efectosSecundarios: ['Dolor muscular leve', 'Fatiga'],
  },
  {
    catalogoId: 'micofenolato',
    nombre: 'Micofenolato mofetilo',
    categoria: 'Inmunosupresor',
    dosis: '500 mg',
    horariosPredeterminados: ['08:00'],
    frecuencia: 'daily',
    proposito: 'Disminuir respuesta inmune (fibrosis)',
    advertencias: [
      'Alto riesgo de infecciones',
      'Evitar contacto con personas enfermas',
    ],
    efectosSecundarios: ['Malestar digestivo', 'Debilidad'],
  },
  {
    catalogoId: 'cotrimoxazol',
    nombre: 'Cotrimoxazol',
    categoria: 'Antibiótico preventivo',
    dosis: 'Variable',
    horariosPredeterminados: ['08:00'],
    frecuencia: 'every_other_day',
    proposito: 'Prevenir infecciones respiratorias',
    advertencias: ['Beber suficiente agua', 'Posibles reacciones cutáneas'],
    efectosSecundarios: ['Náuseas', 'Erupciones'],
  },
  {
    catalogoId: 'espironolactona',
    nombre: 'Espironolactona',
    categoria: 'Diurético',
    dosis: 'Según indicación',
    horariosPredeterminados: ['14:00'],
    frecuencia: 'daily',
    proposito: 'Eliminar líquidos y proteger el corazón',
    advertencias: ['Controlar potasio', 'Puede causar mareos'],
    efectosSecundarios: ['Aumento de orina', 'Fatiga'],
  },
  {
    catalogoId: 'anoro',
    nombre: 'Anoro Ellipta',
    categoria: 'Inhalador broncodilatador',
    dosis: '1 inhalación',
    horariosPredeterminados: ['14:00'],
    frecuencia: 'daily',
    instrucciones: 'Inhalar profundamente una vez al día',
    proposito: 'Mejorar la respiración',
    advertencias: ['No usar más de lo indicado'],
    efectosSecundarios: ['Sequedad bucal', 'Palpitaciones leves'],
  },
  {
    catalogoId: 'valsartan_hct',
    nombre: 'Valsartán / Hidroclorotiazida',
    categoria: 'Antihipertensivo',
    dosis: 'Combinado',
    horariosPredeterminados: ['21:00'],
    frecuencia: 'daily',
    proposito: 'Controlar presión arterial',
    advertencias: ['Puede bajar mucho la presión', 'Controlar mareos'],
    efectosSecundarios: ['Mareos', 'Deshidratación leve'],
  },
  {
    catalogoId: 'amlodipino',
    nombre: 'Amlodipino',
    categoria: 'Antihipertensivo',
    dosis: '5 mg',
    horariosPredeterminados: ['21:00'],
    frecuencia: 'daily',
    proposito: 'Relajar vasos sanguíneos',
    advertencias: ['Puede causar hinchazón en piernas'],
    efectosSecundarios: ['Edema leve', 'Dolor de cabeza'],
  },
  {
    catalogoId: 'bisoprolol',
    nombre: 'Bisoprolol',
    categoria: 'Betabloqueador',
    dosis: '1.25 mg',
    horariosPredeterminados: ['21:00'],
    frecuencia: 'daily',
    proposito: 'Disminuir carga del corazón',
    advertencias: ['No suspender bruscamente', 'Controlar pulso bajo'],
    efectosSecundarios: ['Fatiga', 'Pulso lento'],
  },
];

// Colores por categoría para badges visuales
export const colorCategoria: Record<string, string> = {
  'Corticoide': 'bg-orange-100 text-orange-700',
  'Anticoagulante': 'bg-red-100 text-red-700',
  'Estatina': 'bg-yellow-100 text-yellow-700',
  'Inmunosupresor': 'bg-purple-100 text-purple-700',
  'Antibiótico preventivo': 'bg-green-100 text-green-700',
  'Diurético': 'bg-blue-100 text-blue-700',
  'Inhalador broncodilatador': 'bg-sky-100 text-sky-700',
  'Antihipertensivo': 'bg-indigo-100 text-indigo-700',
  'Betabloqueador': 'bg-pink-100 text-pink-700',
};

// Detecta combinaciones peligrosas entre medicamentos activos (por catalogoId)
export function detectarInteracciones(catalogoIds: (string | undefined)[]): string[] {
  const ids = catalogoIds.filter((id): id is string => Boolean(id));
  const alertas: string[] = [];

  const tieneAnticoagulante = ids.includes('rivaroxaban');
  const tieneCorticoide = ids.includes('prednisona');
  const tieneInmunosupresor = ids.includes('micofenolato');

  if (tieneAnticoagulante && tieneCorticoide) {
    alertas.push(
      'Rivaroxabán + Prednisona activos: alto riesgo de sangrado. Evite golpes y revise moretones a diario.'
    );
  }
  if (tieneAnticoagulante && tieneInmunosupresor) {
    alertas.push(
      'Anticoagulante + Inmunosupresor: ante cualquier infección o sangrado consulte a su médico de inmediato.'
    );
  }

  return alertas;
}

// Determina si un medicamento "día por medio" corresponde tomarse hoy
// Usa paridad de días desde el epoch UTC (todos los "día por medio" comparten el mismo ciclo)
export function correspondeHoy(): boolean {
  const diasDesdeEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return diasDesdeEpoch % 2 === 0;
}
