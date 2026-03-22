'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Inicio', icon: '🏠' },
  { href: '/medicacion', label: 'Medicina', icon: '💊' },
  { href: '/historial', label: 'Historial', icon: '📜' },
  { href: '/nutricion', label: 'Nutrición', icon: '🥗' },
  { href: '/settings', label: 'Ajustes', icon: '⚙️' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 z-50 safe-bottom">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center py-2 px-1 min-w-[60px] transition-colors
                ${isActive ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'}
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="text-2xl" role="img" aria-hidden="true">{item.icon}</span>
              <span className={`text-xs mt-0.5 font-medium ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
