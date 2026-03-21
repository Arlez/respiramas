// Mock de generación de recetas con IA para Vivir Mejor
// En producción se conectaría a un LLM o API de recetas

interface Receta {
  id: string;
  nombre: string;
  ingredientes: string[];
  preparacion: string[];
  beneficio: string;
  restricciones: string[];
  tiempoPreparacion: string;
  categoria: 'desayuno' | 'almuerzo' | 'cena';
}

const BANCO_RECETAS: Receta[] = [
  // DESAYUNOS
  {
    id: 'd1',
    nombre: 'Avena con plátano y canela',
    ingredientes: ['½ taza de avena', '1 plátano maduro', '1 pizca de canela', '1 taza de leche descremada', '1 cucharadita de miel'],
    preparacion: [
      'Hervir la leche a fuego medio.',
      'Agregar la avena y cocinar 5 minutos revolviendo.',
      'Cortar el plátano en rodajas y colocar encima.',
      'Espolvorear canela y un toque de miel.',
    ],
    beneficio: 'La avena aporta fibra que ayuda al corazón. El plátano da potasio, bueno para los riñones. La canela ayuda a controlar el azúcar.',
    restricciones: ['baja en sal', 'baja en potasio'],
    tiempoPreparacion: '10 min',
    categoria: 'desayuno',
  },
  {
    id: 'd2',
    nombre: 'Huevos revueltos con espinaca',
    ingredientes: ['2 huevos', '1 taza de espinaca fresca', '1 cucharadita de aceite de oliva', '1 rebanada de pan integral'],
    preparacion: [
      'Calentar aceite en sartén a fuego medio.',
      'Agregar espinaca y cocinar 2 minutos.',
      'Batir huevos y agregar a la sartén.',
      'Revolver suavemente hasta que cuajen.',
      'Servir con pan integral.',
    ],
    beneficio: 'La espinaca tiene hierro que combate la anemia. Los huevos dan proteína para los músculos. Bajo en sal, protege los riñones.',
    restricciones: ['baja en sal', 'alto en hierro'],
    tiempoPreparacion: '8 min',
    categoria: 'desayuno',
  },
  {
    id: 'd3',
    nombre: 'Batido verde energizante',
    ingredientes: ['1 taza de espinaca', '½ manzana verde', '½ pepino', '1 vaso de agua', 'Jugo de ½ limón'],
    preparacion: [
      'Lavar bien todos los ingredientes.',
      'Cortar la manzana y pepino en trozos.',
      'Licuar todo junto con el agua.',
      'Agregar el limón y servir frío.',
    ],
    beneficio: 'Rico en hierro y vitamina C para la anemia. Hidrata y es suave con los riñones. Los antioxidantes protegen el corazón.',
    restricciones: ['baja en sal', 'alto en hierro', 'hidratante'],
    tiempoPreparacion: '5 min',
    categoria: 'desayuno',
  },

  // ALMUERZOS
  {
    id: 'a1',
    nombre: 'Pollo al horno con verduras',
    ingredientes: ['1 pechuga de pollo', '1 zanahoria', '1 calabacín', '1 cucharada de aceite de oliva', 'Hierbas: orégano, ajo en polvo'],
    preparacion: [
      'Precalentar horno a 180°C.',
      'Cortar verduras en trozos medianos.',
      'Colocar pollo y verduras en bandeja.',
      'Rociar aceite y espolvorear hierbas (sin sal).',
      'Hornear 30 minutos hasta dorar.',
    ],
    beneficio: 'Proteína magra para los músculos. Verduras aportan vitaminas para el corazón. Sin sal añadida, cuida los riñones.',
    restricciones: ['baja en sal', 'alta en proteína'],
    tiempoPreparacion: '40 min',
    categoria: 'almuerzo',
  },
  {
    id: 'a2',
    nombre: 'Lentejas suaves con arroz',
    ingredientes: ['½ taza de lentejas', '½ taza de arroz', '1 zanahoria picada', '½ cebolla', '1 cucharadita de cúrcuma'],
    preparacion: [
      'Remojar lentejas 30 minutos y escurrir.',
      'Cocinar lentejas en agua limpia 20 minutos.',
      'En otra olla, cocinar arroz.',
      'Sofreír cebolla y zanahoria, agregar a las lentejas.',
      'Agregar cúrcuma y servir junto con el arroz.',
    ],
    beneficio: 'Las lentejas son la mejor fuente vegetal de hierro para la anemia. La cúrcuma es antiinflamatoria para los pulmones.',
    restricciones: ['baja en sal', 'alto en hierro', 'antiinflamatoria'],
    tiempoPreparacion: '35 min',
    categoria: 'almuerzo',
  },
  {
    id: 'a3',
    nombre: 'Pescado al vapor con brócoli',
    ingredientes: ['1 filete de tilapia o merluza', '1 taza de brócoli', 'Jugo de limón', '1 cucharadita de aceite de oliva', 'Perejil fresco'],
    preparacion: [
      'Colocar agua en olla con vaporera.',
      'Poner el pescado y brócoli en la vaporera.',
      'Cocinar al vapor 15 minutos.',
      'Servir con limón, aceite y perejil.',
    ],
    beneficio: 'Omega-3 del pescado protege el corazón. El brócoli tiene vitamina C que ayuda a absorber el hierro. Muy suave para los riñones.',
    restricciones: ['baja en sal', 'omega-3', 'antiinflamatoria'],
    tiempoPreparacion: '20 min',
    categoria: 'almuerzo',
  },

  // CENAS
  {
    id: 'c1',
    nombre: 'Sopa de calabaza',
    ingredientes: ['2 tazas de calabaza', '1 papa pequeña', '½ cebolla', '1 cucharadita de aceite de oliva', 'Nuez moscada'],
    preparacion: [
      'Pelar y cortar calabaza y papa.',
      'Hervir en agua con cebolla 20 minutos.',
      'Licuar hasta obtener crema suave.',
      'Agregar aceite y nuez moscada.',
      'Servir tibia.',
    ],
    beneficio: 'La calabaza tiene betacaroteno que protege los pulmones. Baja en sodio, ideal para la presión. Fácil de digerir.',
    restricciones: ['baja en sal', 'suave para digestión'],
    tiempoPreparacion: '25 min',
    categoria: 'cena',
  },
  {
    id: 'c2',
    nombre: 'Tortilla de verduras',
    ingredientes: ['2 huevos', '½ pimiento', '½ cebolla', 'Champiñones', '1 cucharadita de aceite de oliva'],
    preparacion: [
      'Picar todas las verduras en trozos pequeños.',
      'Sofreír verduras en aceite 3 minutos.',
      'Batir huevos y verter sobre las verduras.',
      'Cocinar a fuego bajo hasta que cuaje.',
      'Voltear y dorar el otro lado.',
    ],
    beneficio: 'Proteína de fácil absorción. Los champiñones aportan vitamina D para los huesos. Ligera para la noche.',
    restricciones: ['baja en sal', 'proteína'],
    tiempoPreparacion: '15 min',
    categoria: 'cena',
  },
  {
    id: 'c3',
    nombre: 'Crema de zanahoria con jengibre',
    ingredientes: ['3 zanahorias', '1 trozo pequeño de jengibre', '½ cebolla', '1 cucharada de aceite de oliva', '2 tazas de agua'],
    preparacion: [
      'Pelar y picar zanahorias y cebolla.',
      'Hervir con agua y jengibre rallado 15 minutos.',
      'Licuar hasta hacer crema.',
      'Agregar aceite de oliva.',
      'Servir tibia.',
    ],
    beneficio: 'El jengibre es antiinflamatorio, ayuda a los pulmones. La zanahoria aporta vitamina A para las defensas. Suave para los riñones.',
    restricciones: ['baja en sal', 'antiinflamatoria'],
    tiempoPreparacion: '20 min',
    categoria: 'cena',
  },
];

// Alimentos recomendados organizados por sistema
export interface AlimentoRecomendado {
  nombre: string;
  beneficio: string;
  sistemas: ('corazón' | 'pulmón' | 'riñón' | 'sangre')[];
  icono: string;
}

export const ALIMENTOS_RECOMENDADOS: AlimentoRecomendado[] = [
  { nombre: 'Espinaca', beneficio: 'Rica en hierro y ácido fólico. Combate la anemia y fortalece la sangre.', sistemas: ['sangre', 'corazón'], icono: '🥬' },
  { nombre: 'Salmón / Pescado azul', beneficio: 'Omega-3 que reduce inflamación en pulmones y protege el corazón.', sistemas: ['corazón', 'pulmón'], icono: '🐟' },
  { nombre: 'Calabaza', beneficio: 'Betacaroteno que protege los pulmones. Baja en sodio, buena para la presión.', sistemas: ['pulmón', 'riñón'], icono: '🎃' },
  { nombre: 'Lentejas', beneficio: 'Mejor fuente vegetal de hierro. Proteína suave para los riñones.', sistemas: ['sangre', 'riñón'], icono: '🫘' },
  { nombre: 'Avena', beneficio: 'Fibra soluble que baja el colesterol y cuida el corazón.', sistemas: ['corazón'], icono: '🌾' },
  { nombre: 'Brócoli', beneficio: 'Vitamina C para absorber hierro. Antioxidantes para los pulmones.', sistemas: ['sangre', 'pulmón'], icono: '🥦' },
  { nombre: 'Ajo', beneficio: 'Antiinflamatorio natural. Ayuda a bajar la presión arterial.', sistemas: ['corazón', 'pulmón'], icono: '🧄' },
  { nombre: 'Manzana', beneficio: 'Fibra y antioxidantes. Quercetina que protege los pulmones.', sistemas: ['pulmón', 'corazón'], icono: '🍎' },
  { nombre: 'Zanahoria', beneficio: 'Vitamina A para las defensas. Suave para los riñones.', sistemas: ['pulmón', 'riñón'], icono: '🥕' },
  { nombre: 'Huevo', beneficio: 'Proteína completa de fácil absorción. Vitamina B12 para la anemia.', sistemas: ['sangre'], icono: '🥚' },
  { nombre: 'Aceite de oliva', beneficio: 'Grasas saludables que protegen el corazón y reducen inflamación.', sistemas: ['corazón', 'pulmón'], icono: '🫒' },
  { nombre: 'Jengibre', beneficio: 'Potente antiinflamatorio. Ayuda a la respiración y la digestión.', sistemas: ['pulmón'], icono: '🫚' },
  { nombre: 'Remolacha / Betabel', beneficio: 'Rico en hierro y nitratos que mejoran la oxigenación.', sistemas: ['sangre', 'pulmón'], icono: '🟣' },
  { nombre: 'Agua (suficiente)', beneficio: 'Hidratación esencial. Consulte a su médico la cantidad si tiene problemas renales.', sistemas: ['riñón', 'corazón'], icono: '💧' },

  // Verduras agregadas
  { nombre: 'Lechuga', beneficio: 'Baja en sodio, aporta hidratación y volumen sin carga renal.', sistemas: ['riñón', 'corazón'], icono: '🥗' },
  { nombre: 'Pepino', beneficio: 'Alto en agua, ayuda a controlar la presión arterial y cuida los riñones.', sistemas: ['riñón', 'corazón'], icono: '🥒' },
  { nombre: 'Zapallo italiano', beneficio: 'Bajo en potasio y fácil de digerir, ideal para la dieta renal.', sistemas: ['riñón'], icono: '🥒' },
  { nombre: 'Berenjena', beneficio: 'Fibra y antioxidantes que ayudan a reducir el colesterol.', sistemas: ['corazón'], icono: '🍆' },
  { nombre: 'Coliflor', beneficio: 'Fuente de fibra y vitaminas para la salud cardiovascular.', sistemas: ['corazón'], icono: '🥦' },
  { nombre: 'Repollo', beneficio: 'Rico en antioxidantes que apoyan la salud cardiovascular.', sistemas: ['corazón'], icono: '🥬' },
  { nombre: 'Acelga cocida', beneficio: 'Rica en hierro para combatir la anemia. Cocinarla reduce su potasio.', sistemas: ['sangre'], icono: '🥬' },
  { nombre: 'Pimentón', beneficio: 'Alto en vitamina C, mejora la absorción de hierro y apoya los pulmones.', sistemas: ['pulmón', 'sangre'], icono: '🫑' },
  { nombre: 'Cebolla', beneficio: 'Antiinflamatorio natural que protege el corazón y los vasos sanguíneos.', sistemas: ['corazón'], icono: '🧅' },
  { nombre: 'Apio', beneficio: 'Ayuda a controlar la presión arterial de forma natural.', sistemas: ['corazón'], icono: '🌿' },
  { nombre: 'Rabanitos', beneficio: 'Bajo en potasio y sodio, suave y seguro para los riñones.', sistemas: ['riñón'], icono: '🌱' },

  // Frutas agregadas
  { nombre: 'Pera', beneficio: 'Baja en potasio, buena opción para la salud renal.', sistemas: ['riñón'], icono: '🍐' },
  { nombre: 'Durazno', beneficio: 'Rica en fibra suave que cuida el corazón.', sistemas: ['corazón'], icono: '🍑' },
  { nombre: 'Frutilla', beneficio: 'Antioxidantes que protegen el corazón y los vasos sanguíneos.', sistemas: ['corazón'], icono: '🍓' },
  { nombre: 'Arándanos', beneficio: 'Protección vascular y antioxidantes potentes para el corazón.', sistemas: ['corazón'], icono: '🫐' },
  { nombre: 'Piña', beneficio: 'Propiedades antiinflamatorias que apoyan la función pulmonar.', sistemas: ['pulmón'], icono: '🍍' },
  { nombre: 'Plátano', beneficio: 'Fuente de energía rápida para el corazón. Consumir con moderación por su potasio.', sistemas: ['corazón'], icono: '🍌' },
  { nombre: 'Naranja', beneficio: 'Rica en vitamina C que apoya la producción de glóbulos rojos.', sistemas: ['sangre'], icono: '🍊' },

  // Proteínas agregadas
  { nombre: 'Pescado blanco', beneficio: 'Proteína magra y baja en grasa, amigable con el corazón y los riñones.', sistemas: ['corazón', 'riñón'], icono: '🐠' },
  { nombre: 'Pollo sin piel', beneficio: 'Proteína magra de alto valor biológico, adecuada para la dieta renal.', sistemas: ['riñón'], icono: '🍗' },
  { nombre: 'Pavo', beneficio: 'Proteína baja en grasa, excelente para cuidar los riñones.', sistemas: ['riñón'], icono: '🦃' },

  // Carbohidratos agregados
  { nombre: 'Arroz blanco', beneficio: 'Bajo en potasio y sodio, fuente de energía limpia para la dieta renal.', sistemas: ['riñón'], icono: '🍚' },
  { nombre: 'Fideos', beneficio: 'Energía estable y bajo en potasio, adecuado para la dieta renal.', sistemas: ['riñón'], icono: '🍝' },
  { nombre: 'Pan blanco sin sal', beneficio: 'Bajo en sodio, adecuado para controlar la presión y cuidar los riñones.', sistemas: ['riñón'], icono: '🍞' },

  // Grasas y legumbres agregadas
  { nombre: 'Palta', beneficio: 'Grasas saludables que cuidan el corazón. Porciones moderadas por su potasio.', sistemas: ['corazón'], icono: '🥑' },
  { nombre: 'Garbanzos', beneficio: 'Rica en fibra que apoya la salud cardiovascular. Consumir con moderación.', sistemas: ['corazón'], icono: '🫘' },
];

// Genera 3 recetas diarias (una por comida) de forma pseudo-aleatoria
export function generarRecetasDiarias(): Receta[] {
  const hoy = new Date();
  const seed = hoy.getFullYear() * 10000 + (hoy.getMonth() + 1) * 100 + hoy.getDate();

  const desayunos = BANCO_RECETAS.filter((r) => r.categoria === 'desayuno');
  const almuerzos = BANCO_RECETAS.filter((r) => r.categoria === 'almuerzo');
  const cenas = BANCO_RECETAS.filter((r) => r.categoria === 'cena');

  return [
    desayunos[seed % desayunos.length],
    almuerzos[(seed + 1) % almuerzos.length],
    cenas[(seed + 2) % cenas.length],
  ];
}

export type { Receta };

export interface AlimentoEvitar {
  nombre: string;
  razon: string;
  icono: string;
}

export const ALIMENTOS_EVITAR: AlimentoEvitar[] = [
  { nombre: 'Embutidos', razon: 'Altos en sodio y conservantes que dañan el riñón y el corazón.', icono: '🌭' },
  { nombre: 'Comida rápida', razon: 'Grasas trans y sodio extremo que dañan el corazón.', icono: '🍔' },
  { nombre: 'Bebidas azucaradas', razon: 'Generan inflamación y daño cardiovascular.', icono: '🥤' },
  { nombre: 'Sopas instantáneas', razon: 'Sodio extremadamente alto, muy dañinas para el riñón.', icono: '🍜' },
  { nombre: 'Snacks salados', razon: 'Causan retención de líquidos y elevan la presión arterial.', icono: '🍟' },
  { nombre: 'Frituras', razon: 'Generan grasas oxidadas que producen daño vascular.', icono: '🍤' },
  { nombre: 'Alcohol', razon: 'Tiene impacto directo y grave sobre el riñón y el corazón.', icono: '🍺' },
  { nombre: 'Caldo en cubo', razon: 'Sodio extremadamente concentrado, eleva la presión de inmediato.', icono: '🧊' },
  { nombre: 'Salsas industriales', razon: 'Combinan azúcar y sodio, dos factores de riesgo cardiovascular.', icono: '🫙' },
  { nombre: 'Pan industrial alto en sodio', razon: 'Causa retención de líquidos y sube la presión arterial.', icono: '🍞' },
];
