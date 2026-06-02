import { SignJWT, jwtVerify } from 'jose';
import type { JWTPayload } from 'jose';
import type { User } from '@flownote/shared';

// 拒绝硬编码默认值：生产环境必须显式配置
const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error('JWT_SECRET environment variable is required');
}
const JWT_SECRET = new TextEncoder().encode(secret);

const JWT_ALG = 'HS256';
const EXPIRES_IN = '7d';

export interface TokenPayload {
  userId: number;
  email: string;
}

export function signToken(user: Pick<User, 'id' | 'email'>): Promise<string> {
  return new SignJWT({ userId: user.id, email: user.email } as unknown as JWTPayload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET, {
    algorithms: [JWT_ALG],
  });

  // FIX 14: 运行时校验 JWT payload 结构，防止类型断言掩盖字段缺失
  if (typeof payload.userId !== 'number' || typeof payload.email !== 'string') {
    throw new Error('Invalid token payload structure');
  }

  return { userId: payload.userId, email: payload.email };
}
