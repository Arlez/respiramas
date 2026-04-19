// Cliente HTTP para el backend de Respiramas
// App de un solo paciente - sin autenticación

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

const PACIENTE_ID_KEY = 'respiramas-paciente-id';

// ── Paciente principal (cached) ────────────────────────────────────────────────
let _pacienteId: string | null = null;

export function getPacienteId(): string | null {
  if (_pacienteId) return _pacienteId;
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PACIENTE_ID_KEY);
}

function setPacienteId(id: string): void {
  _pacienteId = id;
  localStorage.setItem(PACIENTE_ID_KEY, id);
}

// ── Fetch genérico ─────────────────────────────────────────────────────────────
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? `Error ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Paciente ───────────────────────────────────────────────────────────────────
export interface PacienteInfo {
  id: string;
  nombre: string;
  email: string;
  edad?: number;
  peso?: number;
  estatura?: number;
  imc?: number;
  imcCategoria?: string;
  aguaML?: number;
  vasosRecomendados?: number;
}

export const pacientesApi = {
  /** Obtiene el paciente principal (único) y cachea su ID */
  getPrincipal: async (): Promise<PacienteInfo> => {
    const p = await request<PacienteInfo>('/pacientes/principal');
    setPacienteId(p.id);
    return p;
  },

  getById: (id: string) => request<PacienteInfo>(`/pacientes/${id}`),

  update: (id: string, data: Partial<PacienteInfo>) =>
    request<PacienteInfo>(`/pacientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  calcularIMC: (id: string) =>
    request<PacienteInfo>(`/pacientes/${id}/calcular-imc`, { method: 'PUT' }),
};

// ── Medicamentos ───────────────────────────────────────────────────────────────
export interface MedicamentoAPI {
  id: string;
  nombre: string;
  dosis: string;
  horarios: string;
  activo: boolean;
  categoria: string;
  proposito?: string;
  frecuencia: string;
  advertencias?: string;
  efectosSecundarios?: string;
}

export const medicamentosApi = {
  getAll: () => request<MedicamentoAPI[]>('/medicamentos'),
  getActivos: () => request<MedicamentoAPI[]>('/medicamentos/activos'),
  toggle: (id: string) => request<MedicamentoAPI>(`/medicamentos/${id}/toggle`, { method: 'PUT' }),
};

// ── Registros ──────────────────────────────────────────────────────────────────
export interface RegistroAPI {
  id?: string;
  pacienteId: string;
  fecha: string;
  tipo: string;
  datos: Record<string, unknown>;
}

export const registrosApi = {
  create: (data: Omit<RegistroAPI, 'id'>) =>
    request<RegistroAPI>('/registros', { method: 'POST', body: JSON.stringify(data) }),

  getByFecha: (pacienteId: string, fecha: string) =>
    request<RegistroAPI[]>(`/registros/${pacienteId}/fecha/${fecha}`),

  getByTipo: (pacienteId: string, tipo: string, fechaInicio?: string, fechaFin?: string) => {
    let url = `/registros/${pacienteId}/tipo/${tipo}`;
    const params = new URLSearchParams();
    if (fechaInicio) params.set('fechaInicio', fechaInicio);
    if (fechaFin) params.set('fechaFin', fechaFin);
    if (params.toString()) url += `?${params}`;
    return request<RegistroAPI[]>(url);
  },

  getByRango: (pacienteId: string, fechaInicio: string, fechaFin: string) =>
    request<RegistroAPI[]>(`/registros/${pacienteId}/rango?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`),
};

// ── Métricas ───────────────────────────────────────────────────────────────────
export interface MetricaAPI {
  pacienteId?: string;
  fecha: string;
  spo2?: number;
  pulso?: number;
  presionSistolica?: number;
  presionDiastolica?: number;
  peso?: number;
  energia?: number;
  hinchazon?: boolean;
  tosExcesiva?: boolean;
  disnea?: boolean;
  manchasMoradas?: boolean;
  flemaSangre?: boolean;
  mareosDebilidad?: boolean;
  apetito?: boolean;
  sueno?: boolean;
  vasosAgua?: number;
  cumplimientoMedicacion?: number;
  cumplimientoProtocolo?: number;
  ejerciciosRealizados?: number;
}

export interface EvolucionData {
  spo2: { fecha: string; valor: number }[];
  pulso: { fecha: string; valor: number }[];
  presion: { fecha: string; sistolica: number; diastolica: number }[];
  peso: { fecha: string; valor: number }[];
  energia: { fecha: string; valor: number }[];
  cumplimientoMedicacion: { fecha: string; valor: number }[];
  cumplimientoProtocolo: { fecha: string; valor: number }[];
}

export const metricasApi = {
  upsert: (data: MetricaAPI & { pacienteId: string }) =>
    request<MetricaAPI>('/metricas', { method: 'POST', body: JSON.stringify(data) }),

  getByFecha: (pacienteId: string, fecha: string) =>
    request<MetricaAPI | null>(`/metricas/${pacienteId}/fecha/${fecha}`),

  getEvolucion: (pacienteId: string, dias = 30) =>
    request<EvolucionData>(`/metricas/${pacienteId}/evolucion?dias=${dias}`),

  getResumenSemanal: (pacienteId: string) =>
    request<Record<string, unknown>>(`/metricas/${pacienteId}/resumen-semanal`),
};

// ── Cumplimiento ───────────────────────────────────────────────────────────────
export interface CumplimientoAPI {
  id?: string;
  pacienteId: string;
  medicamentoId: string;
  fecha: string;
  horario: string;
  tomado: boolean;
}

export const cumplimientoApi = {
  upsert: (data: CumplimientoAPI) =>
    request<CumplimientoAPI>('/cumplimiento', { method: 'POST', body: JSON.stringify(data) }),

  getByFecha: (pacienteId: string, fecha: string) =>
    request<CumplimientoAPI[]>(`/cumplimiento/${pacienteId}/fecha/${fecha}`),

  getPorcentaje: (pacienteId: string, fecha: string) =>
    request<{ porcentaje: number }>(`/cumplimiento/${pacienteId}/porcentaje/${fecha}`),
};

// ── Protocolo ──────────────────────────────────────────────────────────────────
export interface ProtocoloAPI {
  id?: string;
  pacienteId: string;
  fecha: string;
  checks: Record<string, boolean>;
  sintomas: Record<string, boolean>;
  vasosAgua: number;
  porcentajeCompletado: number;
}

export const protocoloApi = {
  upsert: (data: Omit<ProtocoloAPI, 'id'>) =>
    request<ProtocoloAPI>('/protocolo', { method: 'POST', body: JSON.stringify(data) }),

  getByFecha: (pacienteId: string, fecha: string) =>
    request<ProtocoloAPI | null>(`/protocolo/${pacienteId}/fecha/${fecha}`),
};

// ── Alertas ────────────────────────────────────────────────────────────────────
export interface AlertaAPI {
  id: string;
  pacienteId: string;
  tipo: 'critica' | 'advertencia' | 'info';
  mensaje: string;
  modulo: string;
  leida: boolean;
  createdAt: string;
}

export const alertasApi = {
  getAll: (pacienteId: string) =>
    request<AlertaAPI[]>(`/alertas/${pacienteId}`),

  getNoLeidas: (pacienteId: string) =>
    request<AlertaAPI[]>(`/alertas/${pacienteId}/no-leidas`),

  marcarLeida: (id: string) =>
    request<void>(`/alertas/${id}/leida`, { method: 'PUT' }),

  marcarTodas: (pacienteId: string) =>
    request<void>(`/alertas/${pacienteId}/marcar-todas`, { method: 'PUT' }),
};

// ── Recordatorios ──────────────────────────────────────────────────────────────
export interface RecordatorioAPI {
  id?: string;
  pacienteId: string;
  titulo: string;
  cuerpo?: string;
  horario: string;
  activo: boolean;
}

export const recordatoriosApi = {
  getAll: (pacienteId: string) =>
    request<RecordatorioAPI[]>(`/recordatorios/${pacienteId}`),

  create: (data: { pacienteId: string; titulo: string; cuerpo?: string; horario: string }) =>
    request<RecordatorioAPI>('/recordatorios', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: { titulo?: string; cuerpo?: string; horario?: string }) =>
    request<RecordatorioAPI>(`/recordatorios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  toggle: (id: string) =>
    request<RecordatorioAPI>(`/recordatorios/${id}/toggle`, { method: 'PUT' }),

  delete: (id: string) =>
    request<void>(`/recordatorios/${id}`, { method: 'DELETE' }),
};

// ── Recetas Favoritas ──────────────────────────────────────────────────────────
export const recetasFavApi = {
  getAll: (pacienteId: string, categoria?: string) => {
    let url = `/recetas/favoritas/${pacienteId}`;
    if (categoria) url += `?categoria=${categoria}`;
    return request<{ id: string; categoria: string; receta: Record<string, unknown> }[]>(url);
  },

  add: (data: { pacienteId: string; categoria: string; receta: Record<string, unknown> }) =>
    request('/recetas/favoritas', { method: 'POST', body: JSON.stringify(data) }),

  remove: (id: string) =>
    request<void>(`/recetas/favoritas/${id}`, { method: 'DELETE' }),
};

// ── Historial ──────────────────────────────────────────────────────────────────
export const historialApi = {
  registrar: (data: { pacienteId: string; action: string; details?: Record<string, unknown>; date: string }) =>
    request('/historial', { method: 'POST', body: JSON.stringify(data) }),

  getByFecha: (pacienteId: string, fecha: string) =>
    request<unknown[]>(`/historial/${pacienteId}/fecha/${fecha}`),

  getByRango: (pacienteId: string, fechaInicio: string, fechaFin: string) =>
    request<unknown[]>(`/historial/${pacienteId}/rango?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`),
};
