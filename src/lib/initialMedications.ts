// Medicamentos iniciales provistos por el usuario

export type UserMed = {
  id: string;
  name: string;
  genericName?: string;
  category: string;
  dosage: string;
  schedule: {
    times: string[];
    frequency?: 'daily' | 'every_other_day';
  };
  instructions?: string;
  purpose: string;
  warnings?: string[];
  sideEffects?: string[];
  active: boolean;
};

export const initialMedications: UserMed[] = [
  {
    id: "prednisona",
    name: "Prednisona",
    category: "Corticoide",
    dosage: "10 mg",
    schedule: { times: ["10:00"], frequency: "daily" },
    purpose: "Disminuir inflamación pulmonar",
    warnings: [
      "Aumenta fragilidad de la piel",
      "Puede elevar glicemia",
      "Mayor riesgo de infecciones"
    ],
    sideEffects: ["Retención de líquidos", "Moretones", "Debilidad muscular"],
    active: true
  },
  {
    id: "rivaroxaban",
    name: "Rivaroxabán",
    genericName: "Xarelto",
    category: "Anticoagulante",
    dosage: "15 mg",
    schedule: { times: ["10:00"], frequency: "daily" },
    purpose: "Prevenir formación de coágulos",
    warnings: [
      "Alto riesgo de sangrado",
      "Evitar golpes",
      "No combinar con antiinflamatorios sin indicación"
    ],
    sideEffects: ["Moretones", "Sangrado nasal o encías"],
    active: true
  },
  {
    id: "rosuvastatina",
    name: "Rosuvastatina",
    category: "Estatina",
    dosage: "10 mg",
    schedule: { times: ["10:00"], frequency: "daily" },
    purpose: "Reducir colesterol LDL",
    warnings: ["Controlar dolor muscular", "Evitar alcohol excesivo"],
    sideEffects: ["Dolor muscular leve", "Fatiga"],
    active: true
  },
  {
    id: "micofenolato",
    name: "Micofenolato mofetilo",
    category: "Inmunosupresor",
    dosage: "500 mg",
    schedule: { times: ["10:00"], frequency: "daily" },
    purpose: "Disminuir respuesta inmune (fibrosis)",
    warnings: ["Alto riesgo de infecciones", "Evitar contacto con personas enfermas"],
    sideEffects: ["Malestar digestivo", "Debilidad"],
    active: true
  },
  {
    id: "cotrimoxazol",
    name: "Cotrimoxazol",
    category: "Antibiótico preventivo",
    dosage: "800/160 mg",
    schedule: { times: ["10:00"], frequency: "every_other_day" },
    purpose: "Prevenir infecciones respiratorias",
    warnings: ["Beber suficiente agua", "Posibles reacciones cutáneas"],
    sideEffects: ["Náuseas", "Erupciones"],
    active: true
  },
  {
    id: "espironolactona",
    name: "Espironolactona",
    category: "Diurético",
    dosage: "0.5 mg",
    schedule: { times: ["15:00"], frequency: "daily" },
    purpose: "Eliminar líquidos y proteger el corazón",
    warnings: ["Controlar potasio", "Puede causar mareos"],
    sideEffects: ["Aumento de orina", "Fatiga"],
    active: true
  },
  {
    id: "anoro",
    name: "Anoro Ellipta",
    category: "Inhalador broncodilatador",
    dosage: "55/22 mcg · 1 puff",
    schedule: { times: ["15:00"], frequency: "daily" },
    instructions: "Inhalar profundamente una vez al día",
    purpose: "Mejorar la respiración",
    warnings: ["No usar más de lo indicado"],
    sideEffects: ["Sequedad bucal", "Palpitaciones leves"],
    active: true
  },
  {
    id: "valsartan_hct",
    name: "Valax D",
    genericName: "Valsartán / Hidroclorotiazida",
    category: "Antihipertensivo",
    dosage: "160/25 mg",
    schedule: { times: ["22:30"], frequency: "daily" },
    purpose: "Controlar presión arterial",
    warnings: ["Puede bajar mucho la presión", "Controlar mareos"],
    sideEffects: ["Mareos", "Deshidratación leve"],
    active: true
  },
  {
    id: "amlodipino",
    name: "Amlodipino",
    category: "Antihipertensivo",
    dosage: "5 mg",
    schedule: { times: ["22:30"], frequency: "daily" },
    purpose: "Relajar vasos sanguíneos",
    warnings: ["Puede causar hinchazón en piernas"],
    sideEffects: ["Edema leve", "Dolor de cabeza"],
    active: true
  },
  {
    id: "bisoprolol",
    name: "Bisoprolol",
    category: "Betabloqueador",
    dosage: "1.25 mg",
    schedule: { times: ["22:30"], frequency: "daily" },
    purpose: "Disminuir carga del corazón",
    warnings: ["No suspender bruscamente", "Controlar pulso bajo"],
    sideEffects: ["Fatiga", "Pulso lento"],
    active: true
  }
];
