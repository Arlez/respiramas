// Datos de nutrición para Vivir Mejor
// Las recetas son generadas por IA (OpenRouter) vía /api/recetas

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
