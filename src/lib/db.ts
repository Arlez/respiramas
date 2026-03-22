// Base de datos IndexedDB para Respira Más
// Almacena todos los registros de salud, medicamentos e historial offline

import { initialMedications } from './initialMedications';

const DB_NAME = 'respira-más-db';
const DB_VERSION = 5;

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

        // Recetas generadas por IA (cache diario)
        if (!db.objectStoreNames.contains('recetas_ia')) {
          const recetasStore = db.createObjectStore('recetas_ia', { keyPath: 'id', autoIncrement: true });
          recetasStore.createIndex('fecha', 'fecha', { unique: false });
          recetasStore.createIndex('categoria', 'categoria', { unique: false });
          recetasStore.createIndex('fecha_categoria', ['fecha', 'categoria'], { unique: false });
        }

        // Favoritas de recetas (clave: id de receta string)
        if (!db.objectStoreNames.contains('recetas_fav')) {
          const favStore = db.createObjectStore('recetas_fav', { keyPath: 'id' });
          favStore.createIndex('categoria', 'categoria', { unique: false });
          favStore.createIndex('addedAt', 'addedAt', { unique: false });
        }
        
        // Configuración de recordatorios (horarios de notificaciones)
        if (!db.objectStoreNames.contains('recordatorios')) {
          const recStore = db.createObjectStore('recordatorios', { keyPath: 'id' });
          recStore.createIndex('activo', 'activo', { unique: false });
          recStore.createIndex('horario', 'horario', { unique: false });
        }
      
      // Historial de acciones (genérico): guardar acciones/operaciones por fecha, mes, año
      if (!db.objectStoreNames.contains('historial')) {
        const hist = db.createObjectStore('historial', { keyPath: 'id', autoIncrement: true });
        hist.createIndex('date', 'date', { unique: false }); // YYYY-MM-DD
        hist.createIndex('month', 'month', { unique: false }); // YYYY-MM
        hist.createIndex('year', 'year', { unique: false }); // YYYY
        hist.createIndex('timestamp', 'timestamp', { unique: false });
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

// --- API de Recordatorios (configuración) ---

export interface RecordatorioConfig {
  id: string;
  titulo: string;
  cuerpo: string;
  tag?: string;
  horario: string; // "HH:MM"
  activo: boolean;
}

export function guardarRecordatorioConfig(rec: RecordatorioConfig): Promise<void> {
  return updateRecord('recordatorios', rec).catch(async () => {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction('recordatorios', 'readwrite');
      const store = tx.objectStore('recordatorios');
      const req = store.add(rec);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });
}

export function eliminarRecordatorioConfig(id: string): Promise<void> {
  return deleteRecord('recordatorios', id as any);
}

export function obtenerRecordatoriosConfig(): Promise<RecordatorioConfig[]> {
  return getAllRecords('recordatorios');
}

export async function obtenerRecordatoriosActivos(): Promise<RecordatorioConfig[]> {
  const all = await obtenerRecordatoriosConfig();
  return all.filter((r) => r.activo);
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


// Sincroniza horarios de medicamentos existentes con la definición en `initialMedications`.
// Útil cuando se actualiza el catálogo y queremos propagar nuevos horarios a la DB ya instalada.
export async function sincronizarHorariosCatalogo(): Promise<void> {
  try {
    const actuales = await obtenerMedicamentos();
    if (!actuales || actuales.length === 0) return;

    // Mapear initialMedications por catalogoId
    const mapa = new Map<string, { times: string[]; frequency?: string }>();
    initialMedications.forEach((m) => {
      if (m.id && m.schedule?.times) mapa.set(m.id, { times: m.schedule.times, frequency: m.schedule.frequency });
    });

    for (const med of actuales) {
      const catalogoId = med.catalogoId as string | undefined;
      if (catalogoId && mapa.has(catalogoId)) {
        const nueva = mapa.get(catalogoId)!;
        // Comparar y actualizar solo si difiere
        const horariosActuales = (med.horarios || []).slice().sort().join(',');
        const horariosNuevos = (nueva.times || []).slice().sort().join(',');
        if (horariosActuales !== horariosNuevos) {
          const actualizado = { ...med, horarios: nueva.times, frecuencia: nueva.frequency as any } as any;
          try {
            await actualizarMedicamento(actualizado as any);
          } catch (e) {
            // ignore errores por compatibilidad
          }
        }
      }
    }
  } catch (e) {
    // no bloquear la app si falla
  }
}

// Eliminar duplicados de medicamentos en la base de datos.
// Agrupa por `catalogoId` si está presente, sino por `nombre`.
export async function deduplicarMedicamentos(): Promise<void> {
  try {
    const meds = await obtenerMedicamentos();
    if (!meds || meds.length === 0) return;

    const grupos = new Map<string, any[]>();
    meds.forEach((m: any) => {
      const key = m.catalogoId ? `c:${m.catalogoId}` : `n:${(m.nombre || '').toLowerCase()}`;
      if (!grupos.has(key)) grupos.set(key, []);
      grupos.get(key)!.push(m);
    });

    for (const [key, lista] of grupos.entries()) {
      if (lista.length <= 1) continue;
      // mantener el primero y fusionar los demás
      const principal = lista[0];
      const otros = lista.slice(1);

      const horariosSet = new Set<string>((principal.horarios || []).map((h: string) => String(h).slice(0,5)));
      let activo = !!principal.activo;
      let dosis = principal.dosis || principal.dosis;
      let nombre = principal.nombre;

      otros.forEach((o: any) => {
        (o.horarios || []).forEach((h: string) => horariosSet.add(String(h).slice(0,5)));
        activo = activo || !!o.activo;
        if (!dosis && o.dosis) dosis = o.dosis;
      });

      const horarios = Array.from(horariosSet).sort((a,b)=>a.localeCompare(b));
      const actualizado = { ...principal, horarios, activo, dosis, nombre } as any;

      try {
        await actualizarMedicamento(actualizado as any);
      } catch (e) {
        // ignore
      }

      // eliminar los demás por id (si tienen id numérico)
      for (const o of otros) {
        if (typeof o.id === 'number') {
          try { await eliminarMedicamento(o.id as number); } catch (e) { /* ignore */ }
        }
      }
    }
  } catch (e) {
    // noop
  }
}
// --- API de Recetas IA (cache local diario) ---

export interface RecetasIARecord {
  id?: number;
  fecha: string; // YYYY-MM-DD
  categoria: 'desayuno' | 'almuerzo' | 'cena';
  recetas: unknown[];
  timestamp: number;
}

export function guardarRecetasIA(fecha: string, categoria: 'desayuno' | 'almuerzo' | 'cena', recetas: unknown[]): Promise<number> {
  return addRecord('recetas_ia', { fecha, categoria, recetas, timestamp: Date.now() });
}

export async function obtenerRecetasIA(fecha: string, categoria: 'desayuno' | 'almuerzo' | 'cena'): Promise<unknown[] | null> {
  const encontrados = await getByIndex<RecetasIARecord>('recetas_ia', 'fecha_categoria', [fecha, categoria]);
  if (!encontrados || encontrados.length === 0) return null;
  // Devolver la entrada más reciente para esa fecha/categoría
  const ordenado = encontrados.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  return ordenado[0].recetas ?? null;
}

export async function limpiarRecetasAntes(fechaLimite: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('recetas_ia', 'readwrite');
    const store = tx.objectStore('recetas_ia');
    const req = store.openCursor();
    req.onsuccess = (ev) => {
      const cursor = (ev.target as IDBRequest).result as IDBCursorWithValue | null;
      if (cursor) {
        const rec: RecetasIARecord = cursor.value;
        if (rec.fecha < fechaLimite) {
          cursor.delete();
        }
        cursor.continue();
      } else {
        resolve();
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function borrarRecetasFecha(fecha: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('recetas_ia', 'readwrite');
    const store = tx.objectStore('recetas_ia');
    const req = store.openCursor();
    req.onsuccess = (ev) => {
      const cursor = (ev.target as IDBRequest).result as IDBCursorWithValue | null;
      if (cursor) {
        const rec: RecetasIARecord = cursor.value;
        if (rec.fecha === fecha) {
          cursor.delete();
        }
        cursor.continue();
      } else {
        resolve();
      }
    };
    req.onerror = () => reject(req.error);
  });
}

// --- Favoritas de Recetas ---

export interface FavoritaRecord {
  id: string; // usar id de la receta (ej. des-01)
  categoria: 'desayuno' | 'almuerzo' | 'cena';
  receta: unknown;
  addedAt: number;
}

export function guardarFavorita(rec: FavoritaRecord): Promise<void> {
  return updateRecord('recetas_fav', rec).catch(async (err) => {
    // si falla (p.e. no existe), intentar add
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction('recetas_fav', 'readwrite');
      const store = tx.objectStore('recetas_fav');
      const req = store.add(rec);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });
}

export function eliminarFavorita(id: string): Promise<void> {
  return deleteRecord('recetas_fav', id as any);
}

export function obtenerFavoritas(): Promise<FavoritaRecord[]> {
  return getAllRecords('recetas_fav');
}

export function obtenerFavoritasPorCategoria(cat: 'desayuno' | 'almuerzo' | 'cena'): Promise<FavoritaRecord[]> {
  return getByIndex<FavoritaRecord>('recetas_fav', 'categoria', cat);
}

export async function esFavorita(id: string): Promise<boolean> {
  const all = await getAllRecords<FavoritaRecord>('recetas_fav');
  return all.some((f) => f.id === id);
}

export async function verificarYRecrearDB(): Promise<void> {
  const db = await openDB();
  const storeNames = Array.from(db.objectStoreNames as any as string[]);

  if (!storeNames.includes('recordatorios')) {
    console.warn('La store "recordatorios" no existe. Se procederá a recrear la base de datos.');

    // Cerrar la base de datos actual
    db.close();

    // Eliminar la base de datos
    await new Promise<void>((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    });

    console.log('Base de datos eliminada. Se recreará automáticamente al recargar.');
  }
}

