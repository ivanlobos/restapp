import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.ADMIN_SESSION_SECRET!);
const ALG = 'HS256';
const EXPIRES_IN = '7d';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 días

function cookieName(tenantSlug: string) {
  return `admin_session_${tenantSlug}`;
}

/**
 * Crea una sesión admin firmando un JWT y guardándolo en cookie httpOnly.
 * Se llama después de validar la adminKey contra la DB.
 */
export async function createAdminSession(tenantId: string, tenantSlug: string) {
  const token = await new SignJWT({ tenantId, tenantSlug })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set(cookieName(tenantSlug), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

/**
 * Lee la cookie del tenant y valida el JWT.
 * Retorna { tenantId, tenantSlug } si la sesión es válida, null si no.
 */
export async function getAdminSession(tenantSlug: string): Promise<{ tenantId: string; tenantSlug: string } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(cookieName(tenantSlug))?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, SECRET);
    if (typeof payload.tenantId !== 'string' || typeof payload.tenantSlug !== 'string') return null;
    if (payload.tenantSlug !== tenantSlug) return null;

    return { tenantId: payload.tenantId, tenantSlug: payload.tenantSlug };
  } catch {
    return null;
  }
}

/**
 * Borra la cookie de sesión del tenant. Usado por logout.
 */
export async function clearAdminSession(tenantSlug: string) {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName(tenantSlug));
}
