'use client';

interface ToggleInputProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export default function ToggleInput({ label, value, onChange }: ToggleInputProps) {
  return (
    <div className="flex items-center justify-between mb-4 py-2 gap-3">
      <span className="text-lg font-semibold text-gray-700 min-w-0 flex-1">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`
          flex-shrink-0 relative w-16 h-9 rounded-full transition-colors duration-200 overflow-hidden
          ${value ? 'bg-green-500' : 'bg-gray-300'}
          focus:outline-none focus:ring-4 focus:ring-green-200
        `}
      >
        <span
          className={`
            absolute top-1/2 left-1 -translate-y-1/2 w-7 h-7 rounded-full bg-white shadow transition-transform duration-200
            ${value ? 'translate-x-7' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
}
