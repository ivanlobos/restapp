/**
 * Setup global para todos los tests de Vitest.
 *
 * - Carga variables de entorno mínimas necesarias (sin conectar a BD real)
 * - Los mocks de Prisma y fetch se definen en cada archivo de test
 */

// Variables de entorno mínimas para que los módulos inicialicen sin error
process.env.DATABASE_URL = "file:./test.db";
process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"; // 64 hex chars = 32 bytes para AES-256-GCM
process.env.JWT_SECRET = "test-jwt-secret-for-vitest-only";
