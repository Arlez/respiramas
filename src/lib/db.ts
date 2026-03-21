// Base de datos IndexedDB para Vivir Mejor
// Almacena todos los registros de salud, medicamentos e historial offline

import { initialMedications } from './initialMedications';

const DB_NAME = 'vivir-mejor-db';
const DB_VERSION = 2;

export interface RegistroDiario {
  id?: number;
  fecha: string; // YYYY-MM-DD
  tipo: 'respiratorio' | 'ejercicio' | 'cardiorrenal' | 'energia' | 'mental' | 'medicacion';
  datos: Record<string, unknown>;
  timestamp: number;
}

export interface Medicamento {
  id?: number;
  nombre: string;
  dosis: string;
  horarios: string[]; // ["08:00", "20:00"]
  activo: boolean;
  // Campos extendidos (opcionales para compatibilidad con registros anteriores)
  catalogoId?: string;
  categoria?: string;
  proposito?: string;
  instrucciones?: string;
  frecuencia?: 'daily' | 'every_other_day';
  advertencias?: string[];
  efectosSecundarios?: string[];
}

export interface CumplimientoMedicamento {
  id?: number;
  medicamentoId: number;
  fecha: string;
  horario: string;
  tomado: boolean;
  timestamp: number;
}

export interface Alerta {
  id?: number;
  tipo: 'critica' | 'advertencia' | 'info';
  mensaje: string;
  modulo: string;
  fecha: string;
  leida: boolean;
  timestamp: number;
}

let dbInstance: IDBDatabase | null = null;

export function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Registros diarios de salud
      if (!db.objectStoreNames.contains('registros')) {
        const store = db.createObjectStore('registros', { keyPath: 'id', autoIncrement: true });
        store.createIndex('fecha', 'fecha', { unique: false });
        store.createIndex('tipo', 'tipo', { unique: false });
        store.createIndex('fecha_tipo', ['fecha', 'tipo'], { unique: false });
      }

      // Medicamentos
      if (!db.objectStoreNames.contains('medicamentos')) {
        db.createObjectStore('medicamentos', { keyPath: 'id', autoIncrement: true });
      }

      // Cumplimiento de medicamentos
      if (!db.objectStoreNames.contains('cumplimiento')) {
        const cumStore = db.createObjectStore('cumplimiento', { keyPath: 'id', autoIncrement: true });
        cumStore.createIndex('fecha', 'fecha', { unique: false });
        cumStore.createIndex('medicamentoId', 'medicamentoId', { unique: false });
      }

      // Alertas
      if (!db.objectStoreNames.contains('alertas')) {
        const alertStore = db.createObjectStore('alertas', { keyPath: 'id', autoIncrement: true });
        alertStore.createIndex('fecha', 'fecha', { unique: false });
        alertStore.createIndex('leida', 'leida', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = () => reject(request.error);
  });
}

// --- Operaciones genéricas ---

async function addRecord<T>(storeName: string, data: T): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.add(data);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

async function updateRecord<T>(storeName: string, data: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(data);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function deleteRecord(storeName: string, id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getAllRecords<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

async function getByIndex<T>(storeName: string, indexName: string, value: IDBValidKey | IDBKeyRange): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

// --- API de Registros ---

export function guardarRegistro(registro: Omit<RegistroDiario, 'id'>): Promise<number> {
  return addRecord('registros', registro);
}

export function obtenerRegistrosPorFecha(fecha: string): Promise<RegistroDiario[]> {
  return getByIndex('registros', 'fecha', fecha);
}

export function obtenerRegistrosPorTipo(tipo: string): Promise<RegistroDiario[]> {
  return getByIndex('registros', 'tipo', tipo);
}

export function obtenerRegistrosPorFechaYTipo(fecha: string, tipo: string): Promise<RegistroDiario[]> {
  return getByIndex('registros', 'fecha_tipo', [fecha, tipo]);
}

export async function obtenerUltimosRegistros(tipo: string, limite: number): Promise<RegistroDiario[]> {
  const todos = await obtenerRegistrosPorTipo(tipo);
  return todos.sort((a, b) => b.timestamp - a.timestamp).slice(0, limite);
}

// --- API de Medicamentos ---

export function agregarMedicamento(med: Omit<Medicamento, 'id'>): Promise<number> {
  return addRecord('medicamentos', med);
}

export function actualizarMedicamento(med: Medicamento): Promise<void> {
  return updateRecord('medicamentos', med);
}

export function eliminarMedicamento(id: number): Promise<void> {
  return deleteRecord('medicamentos', id);
}

export function obtenerMedicamentos(): Promise<Medicamento[]> {
  return getAllRecords('medicamentos');
}

// --- API de Cumplimiento ---

export function registrarCumplimiento(cum: Omit<CumplimientoMedicamento, 'id'>): Promise<number> {
  return addRecord('cumplimiento', cum);
}

export function obtenerCumplimientoPorFecha(fecha: string): Promise<CumplimientoMedicamento[]> {
  return getByIndex('cumplimiento', 'fecha', fecha);
}

// --- API de Alertas ---

export function crearAlerta(alerta: Omit<Alerta, 'id'>): Promise<number> {
  return addRecord('alertas', alerta);
}

export function obtenerAlertas(): Promise<Alerta[]> {
  return getAllRecords('alertas');
}

export async function obtenerAlertasNoLeidas(): Promise<Alerta[]> {
  return getByIndex('alertas', 'leida', 0);
}

export function marcarAlertaLeida(alerta: Alerta): Promise<void> {
  return updateRecord('alertas', { ...alerta, leida: true });
}

// --- Utilidades ---

export function fechaHoy(): string {
  return new Date().toISOString().split('T')[0];
}

// --- Siembra de medicamentos iniciales ---
// Se ejecuta en runtime: si la store está vacía, inserta los medicamentos predefinidos.
// Funciona aunque la DB ya exista en versiones anteriores.
export async function sembrarMedicamentos(): Promise<void> {
  const existentes = await obtenerMedicamentos();
  if (existentes.length > 0) return; // Ya tiene datos, no sobreescribir

  for (const item of initialMedications) {
    await agregarMedicamento({
      nombre: item.name,
      dosis: item.dosage,
      horarios: item.schedule?.times ?? ['08:00'],
      activo: item.active,
      catalogoId: item.id,
      categoria: item.category,
      proposito: item.purpose,
      instrucciones: item.instructions,
      frecuencia: item.schedule?.frequency,
      advertencias: item.warnings,
      efectosSecundarios: item.sideEffects,
    });
  }
}
