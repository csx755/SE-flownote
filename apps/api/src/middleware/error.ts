import type { Context, Next } from 'hono';

// Duck-type check 替代 instanceof —
// pnpm 严格隔离下不同模块实例的 ZodError 无法通过 instanceof 识别
function isZodError(err: unknown): err is { issues: Array<{ path: (string | number)[]; message: string }> } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'issues' in err &&
    Array.isArray((err as Record<string, unknown>).issues) &&
    'name' in err &&
    (err as Record<string, unknown>).name === 'ZodError'
  );
}

// Hono onError handler — 处理所有 Error 实例
// Hono 内部 compose 会拦截 Error 实例并调用 onError（或默认 handler），
// 所以必须通过 app.onError() 注册，而非 app.use() 中间件
export function errorHandler(err: Error, c: Context) {
  // FIX 10: 畸形 JSON 应返回 400 而非 500
  // 畸形 JSON 请求体返回 400（SyntaxError: "Unexpected token ... in JSON at ..."）
  // 也兼容 Node 24+ 中 c.req.json() 可能抛出 TypeError 的情况
  if (
    err instanceof SyntaxError ||
    (err instanceof TypeError && err.message.toLowerCase().includes('json'))
  ) {
    return c.json({ error: 'Invalid JSON in request body' }, 400);
  }

  if (isZodError(err)) {
    return c.json(
      {
        error: 'Validation Error',
        details: err.issues.map((e) => ({
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
      error: err.message || 'Internal Server Error',
    },
    500
  );
}

// 捕获非 Error 的 throw（字符串等）
// Hono 只将 Error 实例传给 onError；非 Error 的 throw 会被重新抛出，
// 所以需要中间件作为安全网来捕获它们
export async function nonErrorCatcher(c: Context, next: Next) {
  try {
    await next();
  } catch (err) {
    if (err instanceof Error) throw err; // 让 onError 处理
    console.error('[Error]', err);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
}
