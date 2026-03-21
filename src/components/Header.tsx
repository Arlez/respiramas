'use client';

import Link from 'next/link';

interface HeaderProps {
  titulo: string;
  mostrarVolver?: boolean;
}

export default function Header({ titulo, mostrarVolver = false }: HeaderProps) {
  return (
    <header className="sticky top-0 bg-green-600 text-white z-40 shadow-md">
      <div className="max-w-lg mx-auto flex items-center px-4 py-3 gap-3">
        {mostrarVolver && (
          <Link
            href="/"
            className="text-2xl p-1 hover:bg-green-700 rounded-lg"
            aria-label="Volver al inicio"
          >
            ←
          </Link>
        )}
        <h1 className="text-xl font-bold flex-1">{titulo}</h1>
      </div>
    </header>
  );
}
