import { NextResponse } from 'next/server';

import desayunos from '@/lib/data/desayunos.json';
import almuerzos from '@/lib/data/almuerzos.json';
import cenas from '@/lib/data/cenas.json';

type Receta = any;

function pickRandom<T>(arr: T[]) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickNRandom<T>(arr: T[], n: number) {
  if (!Array.isArray(arr) || arr.length === 0) return [] as T[];
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length > 0) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const categoria = url.searchParams.get('categoria') as 'desayuno' | 'almuerzo' | 'cena' | null;

  if (categoria) {
    let lista: Receta[] = [];
    if (categoria === 'desayuno') lista = desayunos as Receta[];
    if (categoria === 'almuerzo') lista = almuerzos as Receta[];
    if (categoria === 'cena') lista = cenas as Receta[];

    if (!lista || lista.length === 0) {
      return NextResponse.json({ error: `No hay recetas para ${categoria}` }, { status: 404 });
    }

    const recetas = pickNRandom(lista, 3);
    return NextResponse.json({ recetas, modelo: 'local' });
  }

  // Sin categoría: devolver hasta 3 recetas mezclando las tres listas
  const combinado: Receta[] = [...(desayunos as Receta[]), ...(almuerzos as Receta[]), ...(cenas as Receta[])];
  const recetas = pickNRandom(combinado, 3);
  if (!recetas || recetas.length === 0) return NextResponse.json({ error: 'No hay recetas disponibles' }, { status: 500 });

  return NextResponse.json({ recetas, modelo: 'local' });
}
