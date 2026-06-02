import type { Context, Next } from 'hono';
import { ZodError } from 'zod';

export async function errorHandler(c: Context, next: Next) {
  try {
    await next();
  } catch (err) {
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
