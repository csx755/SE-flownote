import type { Context, Next } from 'hono';
import { ZodError } from 'zod';

export async function errorHandler(c: Context, next: Next) {
  try {
    await next();
  } catch (err) {
    // FIX 10: 畸形 JSON 应返回 400 而非 500
    if (err instanceof SyntaxError) {
      return c.json({ error: 'Invalid JSON in request body' }, 400);
    }

    if (err instanceof ZodError) {
      return c.json(
        {
          error: 'Validation Error',
          details: err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        400
      );
    }

    console.error('[Error]', err);

    return c.json(
      {
        error: err instanceof Error ? err.message : 'Internal Server Error',
      },
      500
    );
  }
}
