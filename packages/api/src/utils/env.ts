import type { Context } from 'hono';

export const getGeminiApiKey = (
  c: Context<{ Bindings: CloudflareBindings }>,
): string => {
  return c.env.GEMINI_API_KEY;
};
