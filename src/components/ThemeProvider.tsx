'use client';

import { useEffect } from 'react';

/**
 * Aplica el tema guardado en localStorage al elemento <html>
 * antes del primer render visible. Se monta en layout.tsx.
 */
export default function ThemeProvider() {
  useEffect(() => {
    const saved = typeof window !== 'undefined'
      ? localStorage.getItem('theme')
      : null;
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return null;
}
