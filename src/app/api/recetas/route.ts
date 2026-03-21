import { NextResponse } from 'next/server';
import { ALIMENTOS_RECOMENDADOS } from '@/lib/recipes-ai';

const buildPrompt = (alimentos: string) =>
  `Eres nutricionista clínico especializado en pacientes con enfermedad cardiorrenal, EPOC y anemia.

Genera exactamente 9 recetas saludables: 3 desayunos, 3 almuerzos y 3 cenas.
Usa preferentemente estos alimentos: ${alimentos}.
Características requeridas: bajas en sal (<500mg sodio), antiinflamatorias, fáciles de preparar en casa.

Responde ÚNICAMENTE con un JSON array válido, sin texto adicional ni bloques de código markdown, con exactamente 9 objetos y esta estructura:
[
  {
    "id": "d1",
    "nombre": "Nombre de la receta",
    "ingredientes": ["ingrediente 1", "ingrediente 2"],
    "preparacion": ["paso 1", "paso 2"],
    "beneficio": "Descripción del beneficio para la salud del paciente",
    "restricciones": ["baja en sal"],
    "tiempoPreparacion": "15 min",
    "categoria": "desayuno"
  }
]
Las categorías deben ser exactamente "desayuno", "almuerzo" o "cena". Incluye exactamente 3 de cada una.`;

export async function GET() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENROUTER_API_KEY no configurada en .env.local' },
      { status: 500 }
    );
  }

  const alimentos = ALIMENTOS_RECOMENDADOS.map((a) => a.nombre).join(', ');

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'stepfun/step-3.5-flash:free',
        messages: [{ role: 'user', content: buildPrompt(alimentos) }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `OpenRouter: ${err}` }, { status: res.status });
    }

    const data = await res.json();
    const content: string = data.choices[0].message.content;

    // Extraer el JSON array de la respuesta (puede venir con markdown u otro texto)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'La IA no devolvió un JSON válido' }, { status: 500 });
    }

    const recetas = JSON.parse(jsonMatch[0]);
    return NextResponse.json(recetas);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
