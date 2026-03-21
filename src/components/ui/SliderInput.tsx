'use client';

interface SliderInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  colorStops?: { value: number; color: string }[];
}

export default function SliderInput({
  label,
  value,
  onChange,
  min = 1,
  max = 10,
  step = 1,
  unit = '',
  colorStops,
}: SliderInputProps) {
  const getColor = () => {
    if (!colorStops) {
      const ratio = (value - min) / (max - min);
      if (ratio < 0.4) return 'text-green-600';
      if (ratio < 0.7) return 'text-yellow-600';
      return 'text-red-600';
    }
    for (let i = colorStops.length - 1; i >= 0; i--) {
      if (value >= colorStops[i].value) return colorStops[i].color;
    }
    return 'text-gray-800';
  };

  return (
    <div className="mb-4">
      <label className="block text-lg font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-3 rounded-full appearance-none bg-gray-200 accent-green-600"
          style={{ accentColor: '#16a34a' }}
        />
        <span className={`text-3xl font-bold min-w-[80px] text-right ${getColor()}`}>
          {value}{unit}
        </span>
      </div>
      <div className="flex justify-between text-sm text-gray-400 mt-1">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}
