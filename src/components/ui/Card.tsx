import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  icon?: string;
  className?: string;
  color?: 'white' | 'green' | 'blue' | 'yellow' | 'red' | 'purple';
}

const colors = {
  white:  'bg-white border-gray-200',
  green:  'bg-green-50 border-green-200',
  blue:   'bg-blue-50 border-blue-200',
  yellow: 'bg-yellow-50 border-yellow-200',
  red:    'bg-red-50 border-red-200',
  purple: 'bg-purple-50 border-purple-200',
};

export default function Card({ children, title, icon, className = '', color = 'white' }: CardProps) {
  return (
    <div className={`rounded-2xl border-2 p-5 shadow-sm ${colors[color]} ${className}`}>
      {(title || icon) && (
        <div className="flex items-center gap-3 mb-3">
          {icon && <span className="text-3xl" role="img" aria-hidden="true">{icon}</span>}
          {title && <h3 className="text-xl font-bold text-gray-800">{title}</h3>}
        </div>
      )}
      {children}
    </div>
  );
}
