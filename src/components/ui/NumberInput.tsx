'use client';

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
}

export default function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = '',
  placeholder,
}: NumberInputProps) {
  return (
    <div className="mb-4">
      <label className="block text-lg font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min ?? -Infinity, value - step))}
          className="w-14 h-14 rounded-xl bg-gray-100 text-2xl font-bold text-gray-700 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center"
          aria-label={`Reducir ${label}`}
        >
          −
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!isNaN(v)) onChange(v);
          }}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          className="flex-1 text-center text-2xl font-bold py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none bg-white text-gray-800"
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(max ?? Infinity, value + step))}
          className="w-14 h-14 rounded-xl bg-gray-100 text-2xl font-bold text-gray-700 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center"
          aria-label={`Aumentar ${label}`}
        >
          +
        </button>
        {unit && <span className="text-lg font-semibold text-gray-500 min-w-[40px]">{unit}</span>}
      </div>
    </div>
  );
}
