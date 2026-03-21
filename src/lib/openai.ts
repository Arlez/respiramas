// Helper para leer la API key de OpenRouter desde variables de entorno
export function getOpenRouterApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error(
      'OPENROUTER_API_KEY no está definida. Crea .env.local con OPENROUTER_API_KEY=...'
    );
  }
  return key;
}
