'use client';

interface AlertBannerProps {
  tipo: 'critica' | 'advertencia' | 'info' | 'exito';
  mensaje: string;
  onClose?: () => void;
}

const estilos = {
  critica: { bg: 'bg-red-100 border-red-400', text: 'text-red-800', icon: '🚨' },
  advertencia: { bg: 'bg-yellow-100 border-yellow-400', text: 'text-yellow-800', icon: '⚠️' },
  info: { bg: 'bg-blue-100 border-blue-400', text: 'text-blue-800', icon: 'ℹ️' },
  exito: { bg: 'bg-green-100 border-green-400', text: 'text-green-800', icon: '✅' },
};

export default function AlertBanner({ tipo, mensaje, onClose }: AlertBannerProps) {
  const estilo = estilos[tipo];

  return (
    <div
      className={`${estilo.bg} border-l-4 rounded-xl p-4 mb-4 flex items-start gap-3`}
      role="alert"
      aria-live={tipo === 'critica' ? 'assertive' : 'polite'}
    >
      <span className="text-2xl flex-shrink-0" role="img" aria-hidden="true">
        {estilo.icon}
      </span>
      <p className={`${estilo.text} text-lg font-medium flex-1`}>{mensaje}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-xl font-bold p-1"
          aria-label="Cerrar alerta"
        >
          ✕
        </button>
      )}
    </div>
  );
}
