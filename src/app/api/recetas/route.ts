import { NextResponse } from 'next/server';
import { ALIMENTOS_RECOMENDADOS } from '@/lib/recipes-ai';

const buildPrompt = (alimentos: string) =>
  `Eres nutricionista clínico.

Devuelve SOLO un array JSON con 9 recetas (3 desayunos, 3 almuerzos, 3 cenas).
Usa estos alimentos: ${alimentos}.
Reglas: bajas en sodio, antiinflamatorias, fáciles.

CRÍTICO: Responde ÚNICAMENTE con el JSON array. Sin texto ni markdown.
Cada campo DEBE ser corto: nombre (max 40 chars), beneficio (max 80 chars), tiempoPreparacion (max 10 chars).
Máximo 3 ingredientes y 3 pasos por receta.

[
  {
    "id": "d1",
    "nombre": "Nombre breve",
    "ingredientes": ["ing1", "ing2"],
    "preparacion": ["Paso 1.", "Paso 2."],
    "beneficio": "Beneficio en una frase breve",
    "restricciones": ["baja en sal"],
    "tiempoPreparacion": "10 min",
    "categoria": "desayuno"
  }
]
Categorías: exactamente "desayuno", "almuerzo", "cena". Exactamente 3 de cada una.`;

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
    // Añadir timeout para evitar que la petición quede pendiente indefinidamente
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'stepfun/step-3.5-flash:free',
        messages: [{ role: 'user', content: buildPrompt(alimentos) }],
        max_tokens: 4000,
        temperature: 0.3,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `OpenRouter: ${err}` }, { status: res.status });
    }

    const data = await res.json().catch((e) => null);
    if (!data || !data.choices || !data.choices[0]) {
      console.error('OpenRouter: respuesta inesperada', { status: res.status, text: await res.text().catch(() => '') });
      return NextResponse.json({ error: 'Respuesta inesperada de OpenRouter' }, { status: 502 });
    }

    const choice = data.choices[0];
    const message = choice.message || choice;
    const content: string = message.content || (typeof message === 'string' ? message : JSON.stringify(message));
    const reasoning = message.reasoning_details || message.reasoning || null;

    // Extraer el JSON array de la respuesta (puede venir con markdown u otro texto)
    let jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      const i = content.indexOf('[');
      if (i >= 0) jsonMatch = [content.slice(i)];
    }

    if (!jsonMatch) {
      console.error('OpenRouter: no se pudo extraer JSON', { contentSnippet: content.slice(0, 1000) });
      return NextResponse.json({ error: 'La IA no devolvió un JSON válido' }, { status: 500 });
    }

    let recetas: any;
    try {
      recetas = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('OpenRouter: JSON inválido', { err: e, snippet: jsonMatch[0].slice(0, 1000) });

      // Intento de recuperación: pedir al modelo que extraiga y devuelva SOLO el array JSON
      try {
        const recController = new AbortController();
        const recTimeout = setTimeout(() => recController.abort(), 15000);

        const recoveryPrompt = `Extrae y devuelve SÓLO el array JSON presente en el siguiente texto. Responde únicamente con el JSON, sin explicaciones ni texto adicional. Texto:\n\n${jsonMatch[0]}`;

        const recRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'stepfun/step-3.5-flash:free',
            messages: [{ role: 'user', content: recoveryPrompt }],
          }),
          signal: recController.signal,
        });
        clearTimeout(recTimeout);

        const recData = await recRes.json().catch(() => null);
        const recContent = recData?.choices?.[0]?.message?.content || recData?.choices?.[0] || null;
        const recJsonMatch = recContent ? String(recContent).match(/\[[\s\S]*\]/) : null;
        if (recJsonMatch) {
          try {
            const repaired = JSON.parse(recJsonMatch[0]);
            return NextResponse.json({ recetas: repaired, reasoning, recovered: true });
          } catch (inner) {
            console.error('OpenRouter: recuperación JSON falló al parsear', inner);
            return NextResponse.json({ raw: jsonMatch[0], recovery: recJsonMatch[0], reasoning, note: 'recovery_parse_failed' });
          }
        }

        return NextResponse.json({ raw: jsonMatch[0], recovery: recContent ?? null, reasoning, note: 'json_parse_failed' });
      } catch (recErr) {
        console.error('OpenRouter: intento de recuperación falló', recErr);
        return NextResponse.json({ raw: jsonMatch[0], reasoning, recoveryError: String(recErr), note: 'json_parse_failed' });
      }
    }

    if (!Array.isArray(recetas) || recetas.length !== 9) {
      console.warn('OpenRouter: recetas inesperadas (no 9)', { length: Array.isArray(recetas) ? recetas.length : typeof recetas });
      return NextResponse.json({ recetas, reasoning });
    }

    return NextResponse.json({ recetas, reasoning });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
