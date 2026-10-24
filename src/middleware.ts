import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * Rate limiter en memoria — sliding window por IP.
 *
 * DEUDA CONOCIDA (DT-3B): este estado vive por proceso. Si Vercel escala
 * a múltiples workers, cada uno tiene su propio contador independiente.
 * Para los primeros 10-50 tenants es completamente suficiente.
 * Migrar a Upstash Redis cuando haya 10+ tenants activos pagando:
 *   npm install @upstash/ratelimit @upstash/redis
 *   y reemplazar checkRateLimit() por Ratelimit.slidingWindow()
 */

interface WindowEntry {
  count: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, WindowEntry>();

// Limpiar entradas expiradas cada 5 minutos para no crecer indefinidamente
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((entry, key) => {
      if (now - entry.windowStart > 60_000) rateLimitStore.delete(key);
    });
  }, 5 * 60 * 1000);
}

interface RateLimitConfig {
  /** Requests permitidas por ventana */
  limit: number;
  /** Duración de la ventana en ms */
  windowMs: number;
}

/**
 * Retorna true si la request debe ser bloqueada.
 * Clave = IP + ruta (para no mezclar contadores entre endpoints).
 */
function checkRateLimit(key: string, config: RateLimitConfig): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now - entry.windowStart > config.windowMs) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return false; // OK
  }

  entry.count++;
  if (entry.count > config.limit) return true; // bloqueado
  return false;
}

/**
 * Extrae la IP del cliente de los headers de Vercel/Next.js.
 * Fallback a "unknown" si no hay header (desarrollo local).
 */
function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// Configuraciones por tipo de ruta
const RATE_LIMITS = {
  // Llamado al garzón: el cliente puede presionar varias veces, pero 10/min es más que suficiente
  waiter: { limit: 10, windowMs: 60_000 },
  // Creación de órdenes y pagos: operaciones costosas, 5/min por IP es holgado para uso real
  orders: { limit: 5, windowMs: 60_000 },
  payments: { limit: 5, windowMs: 60_000 },
  // Login admin: protección contra fuerza bruta de PIN
  adminLogin: { limit: 10, windowMs: 60_000 },
  // API general: 60 req/min — protege sin molestar al admin legítimo
  api: { limit: 60, windowMs: 60_000 },
} as const;

const intlMiddleware = createIntlMiddleware(routing);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = getClientIp(req);

  // Solo aplicar rate limit a rutas /api/*
  if (pathname.startsWith("/api/")) {
    let config: RateLimitConfig = RATE_LIMITS.api;
    let bucket = "api";

    if (pathname.startsWith("/api/waiter")) {
      config = RATE_LIMITS.waiter;
      bucket = "waiter";
    } else if (pathname.startsWith("/api/orders")) {
      config = RATE_LIMITS.orders;
      bucket = "orders";
    } else if (
      pathname.startsWith("/api/payments") ||
      pathname.startsWith("/api/mercadopago")
    ) {
      config = RATE_LIMITS.payments;
      bucket = "payments";
    } else if (pathname.startsWith("/api/admin/login")) {
      config = RATE_LIMITS.adminLogin;
      bucket = "adminLogin";
    }

    const key = `${ip}:${bucket}`;
    const blocked = checkRateLimit(key, config);

    if (blocked) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta en un momento." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(config.windowMs / 1000)),
            "X-RateLimit-Limit": String(config.limit),
          },
        }
      );
    }

    // Rutas API no necesitan el middleware de i18n
    return NextResponse.next();
  }

  // Para todo lo demás, delegar al middleware de next-intl
  return intlMiddleware(req);
}

export const config = {
  matcher: [
    // Rutas API
    "/api/:path*",
    // Rutas i18n (excluye _next, archivos estáticos, etc.)
    "/((?!_next|_vercel|.*\\..*).*)",
  ],
};
