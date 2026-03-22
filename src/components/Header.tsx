'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  titulo: string;
  mostrarVolver?: boolean;
  onVolver?: () => void;
}

export default function Header({ titulo, mostrarVolver = false, onVolver }: HeaderProps) {
  const router = useRouter();

  const handleVolver = useCallback(() => {
    if (onVolver) {
      try {
        onVolver();
      } catch (e) {
        // ignore errors from parent handler
      }
      return;
    }

    if (typeof window !== 'undefined' && window.history && window.history.length > 1) {
      router.back();
    } else {
      return;
    }
  }, [onVolver, router]);

  return (
    <header className="sticky top-0 bg-green-600 text-white z-40 shadow-md">
      <div className="max-w-lg mx-auto flex items-center px-4 py-3 gap-3">
        {mostrarVolver && (
          <button
            onClick={handleVolver}
            className="text-2xl p-1 hover:bg-green-700 rounded-lg"
            aria-label="Volver"
            title="Volver"
          >
            ←
          </button>
        )}
        <h1 className="text-xl font-bold flex-1">{titulo}</h1>
      </div>
    </header>
  );
}
