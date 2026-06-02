import { SignJWT, jwtVerify } from 'jose';
import type { User } from '@flownote/shared';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'change-me-in-production'
);

const JWT_ALG = 'HS256';
const EXPIRES_IN = '7d';

export interface TokenPayload {
  userId: number;
  email: string;
}

export function signToken(user: Pick<User, 'id' | 'email'>): Promise<string> {
  return new SignJWT({ userId: user.id, email: user.email } as TokenPayload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET, {
    algorithms: [JWT_ALG],
  });
  return payload as unknown as TokenPayload;
}
