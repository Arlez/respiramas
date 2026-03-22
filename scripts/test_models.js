const fs = require('fs');
const path = require('path');

(async () => {
  const env = fs.readFileSync(path.resolve(__dirname, '..', '.env.local'), 'utf8');
  const key = env.match(/OPENROUTER_API_KEY=(.*)/)[1].trim();

  const models = [
    'nvidia/nemotron-3-super-120b-a12b:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'mistralai/mistral-small-3.1-24b-instruct:free',
    'google/gemma-3-27b-it:free',
  ];

  for (const model of models) {
    try {
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://respiramas.vercel.app',
          'X-OpenRouter-Title': 'Respiramas',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Reply only: [ok]' }],
          max_tokens: 20,
        }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await r.json();
      const content = data.choices?.[0]?.message?.content ?? '';
      const finish = data.choices?.[0]?.finish_reason ?? '';
      console.log(`[${r.status}] ${model}: finish=${finish} content=${content.substring(0, 40)}`);
    } catch (e) {
      console.log(`[ERR] ${model}: ${e.message}`);
    }
  }
})();
