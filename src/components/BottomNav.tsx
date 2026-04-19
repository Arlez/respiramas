'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Protocolo', icon: '📋' },
  { href: '/historial', label: 'Historial', icon: '📊' },
  { href: '/ejercicios', label: 'Ejercicios', icon: '🏃' },
  { href: '/nutricion', label: 'Nutrición', icon: '🥗' },
  { href: '/settings', label: 'Ajustes', icon: '⚙️' },
];

const sidebarExtra = [
  { href: '/dashboard', label: 'Dashboard', icon: '📈' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <>
      <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 w-56 bg-white dark:bg-gray-900 border-r-2 border-gray-200 dark:border-gray-700 z-50 flex-col pt-6">
        <div className="px-4 mb-8">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">🫁 Respira Más</p>
          <p className="text-xs text-gray-400 mt-1">Seguimiento diario</p>
        </div>
        <div className="flex flex-col gap-1 px-2 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${isActive ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="text-xl" role="img" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
          {sidebarExtra.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${isActive ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="text-xl" role="img" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-400">v0.1 - Uso familiar</p>
        </div>
      </nav>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t-2 border-gray-200 dark:border-gray-700 z-50 safe-bottom">
        <div className="flex justify-around items-center max-w-3xl mx-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center py-2 px-0.5 min-w-[52px] min-h-[60px] justify-center transition-colors ${isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="text-2xl" role="img" aria-hidden="true">{item.icon}</span>
                <span className={`text-xs mt-0.5 font-medium ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}