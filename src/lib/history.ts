// Módulo de historial que guarda acciones en IndexedDB
import { openDB } from './db';
import { obtenerRegistrosPorFecha, obtenerCumplimientoPorFecha, obtenerMedicamentos } from './db';

const ALL_TYPES = ['respiratorio', 'ejercicio', 'cardiorrenal', 'energia', 'medicacion', 'mental'] as const;
type TipoRegistro = typeof ALL_TYPES[number];

export interface HistoryEntry {
  id?: number;
  action: string; // breve descripción de la acción
  details?: any; // objeto con información opcional
  timestamp: number; // ms
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  year: string; // YYYY
}

function toDateParts(ts: number) {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return { date: `${yyyy}-${mm}-${dd}`, month: `${yyyy}-${mm}`, year: `${yyyy}` };
}

export async function addHistory(action: string, details?: any, timestamp?: number): Promise<number> {
  const ts = timestamp ?? Date.now();
  const parts = toDateParts(ts);
  const db = await openDB();
  return new Promise<number>((resolve, reject) => {
    const tx = db.transaction('historial', 'readwrite');
    const store = tx.objectStore('historial');
    const req = store.add({ action, details, timestamp: ts, date: parts.date, month: parts.month, year: parts.year });
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  });
}

export async function getHistoryByDay(date: string): Promise<HistoryEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('historial', 'readonly');
    const store = tx.objectStore('historial');
    const idx = store.index('date');
    const req = idx.getAll(date);
    req.onsuccess = () => resolve(req.result as HistoryEntry[]);
    req.onerror = () => reject(req.error);
  });
}

export async function getHistoryByMonth(month: string): Promise<HistoryEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('historial', 'readonly');
    const store = tx.objectStore('historial');
    const idx = store.index('month');
    const req = idx.getAll(month);
    req.onsuccess = () => resolve(req.result as HistoryEntry[]);
    req.onerror = () => reject(req.error);
  });
}

export async function getHistoryByYear(year: string): Promise<HistoryEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('historial', 'readonly');
    const store = tx.objectStore('historial');
    const idx = store.index('year');
    const req = idx.getAll(year);
    req.onsuccess = () => resolve(req.result as HistoryEntry[]);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllHistory(): Promise<HistoryEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('historial', 'readonly');
    const store = tx.objectStore('historial');
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result as HistoryEntry[]).sort((a, b) => b.timestamp - a.timestamp));
    req.onerror = () => reject(req.error);
  });
}

export async function clearHistory(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('historial', 'readwrite');
    const store = tx.objectStore('historial');
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// --- Resumen diario y rangos ---

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export interface DailySummary {
  date: string; // YYYY-MM-DD
  typesCompleted: string[];
  percentage: number; // 0-100
  registros: any[];
  medExpected?: number;
  medTaken?: number;
  medPercentage?: number; // 0-100
}

export async function getDailySummary(date: string): Promise<DailySummary> {
  // obtener registros del día
  const registros = await obtenerRegistrosPorFecha(date);
  const tiposPresentes = new Set(registros.map((r: any) => r.tipo));

  // calcular cumplimiento de medicación (si aplica)
  const medicamentos = await obtenerMedicamentos();
  // calcular expected doses para el día
  let medExpected = 0;
  try {
    const { correspondeHoy } = await import('./medications');
    medicamentos.forEach((m: any) => {
      if (!m.activo) return;
      if (m.frecuencia === 'every_other_day' && !correspondeHoy()) return;
      medExpected += (m.horarios?.length ?? 0);
    });
  } catch (e) {
    // si falla, ignorar y dejar medExpected como suma de horarios
    medicamentos.forEach((m: any) => {
      if (!m.activo) return;
      medExpected += (m.horarios?.length ?? 0);
    });
  }

  const cumplimiento = await obtenerCumplimientoPorFecha(date);
  const medTaken = cumplimiento.filter((c: any) => c.tomado).length;

  const medPercentage = medExpected > 0 ? Math.round((medTaken / medExpected) * 100) : (tiposPresentes.has('medicacion') ? 100 : 0);
  const medCompleted = medExpected === 0 ? tiposPresentes.has('medicacion') : medTaken >= medExpected;

  const typesCompleted = new Set<string>([...tiposPresentes]);
  if (!typesCompleted.has('medicacion') && medCompleted) typesCompleted.add('medicacion');

  const percentage = Math.round((Array.from(typesCompleted).length / ALL_TYPES.length) * 100);

  return {
    date,
    typesCompleted: Array.from(typesCompleted),
    percentage,
    registros,
    medExpected,
    medTaken,
    medPercentage,
  };
}

export async function getSummariesForRange(startDate: string, endDate: string): Promise<DailySummary[]> {
  const out: DailySummary[] = [];
  let cur = startDate;
  while (cur <= endDate) {
    // eslint-disable-next-line no-await-in-loop
    const s = await getDailySummary(cur);
    out.push(s);
    cur = addDays(cur, 1);
  }
  return out;
}

export default { addHistory, getHistoryByDay, getHistoryByMonth, getHistoryByYear, getAllHistory, clearHistory };
