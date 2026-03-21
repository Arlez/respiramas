const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const envPath = path.resolve(__dirname, '..', '.env.local');
    const env = fs.readFileSync(envPath, 'utf8');
    const m = env.match(/OPENROUTER_API_KEY=(.*)/);
    if (!m) throw new Error('OPENROUTER_API_KEY not found in .env.local');
    const key = m[1].trim();

    const prompt = `Eres nutricionista clínico.\n\nDevuelve SOLO un array JSON con 9 recetas (3 desayunos, 3 almuerzos, 3 cenas).\nReglas: bajas en sodio, antiinflamatorias, fáciles.\n\nCRÍTICO: Responde ÚNICAMENTE con el JSON array. Sin texto ni markdown.\nCada campo DEBE ser corto: nombre (max 40 chars), beneficio (max 80 chars), tiempoPreparacion (max 10 chars).\nMáximo 3 ingredientes y 3 pasos por receta.\n\n[\n  {\n    "id": "d1",\n    "nombre": "Nombre breve",\n    "ingredientes": ["ing1", "ing2"],\n    "preparacion": ["Paso 1.", "Paso 2."],\n    "beneficio": "Beneficio en una frase breve",\n    "restricciones": ["baja en sal"],\n    "tiempoPreparacion": "10 min",\n    "categoria": "desayuno"\n  }\n]\nCategorías: exactamente "desayuno", "almuerzo", "cena". Exactamente 3 de cada una.`;

    const payload = {
      model: 'stepfun/step-3.5-flash:free',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4000,
      temperature: 0.3,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeout);

    const text = await res.text();
    console.log('status:', res.status);
    console.log('body:', text);
  } catch (err) {
    console.error('ERROR:', err && err.message ? err.message : err);
    process.exitCode = 2;
  }
})();
