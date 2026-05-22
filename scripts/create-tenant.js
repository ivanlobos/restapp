/**
 * Crea un tenant (restaurante) nuevo desde cero.
 *
 * Uso:
 *   node scripts/create-tenant.js --slug=donpepe --name="Don Pepe Parrilla" --tables=10
 *
 * Flags:
 *   --slug          (requerido) identificador URL-safe, unico
 *   --name          (requerido) nombre comercial
 *   --tables        (opcional, default 10) cantidad de mesas
 *   --currency      (opcional, default CLP) CLP|USD|EUR|ARS|PEN|MXN
 *   --no-categories (opcional) si se pasa, NO crea categorias base
 *
 * Usa la DB de .env (dev por defecto).
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

const ALLOWED_CURRENCIES = ['CLP', 'USD', 'EUR', 'ARS', 'PEN', 'MXN'];
const BASE_CATEGORIES = ['Entradas', 'Platos de fondo', 'Bebidas', 'Postres'];

function generateAdminKey() {
  return crypto.randomBytes(32).toString('hex');
}

// Parser simple de flags --key=value y flags booleanos --flag
function parseArgs(argv) {
  const args = {};
  for (const part of argv.slice(2)) {
    if (!part.startsWith('--')) continue;
    const eq = part.indexOf('=');
    if (eq === -1) {
      args[part.slice(2)] = true; // flag booleano
    } else {
      args[part.slice(2, eq)] = part.slice(eq + 1);
    }
  }
  return args;
}

function fail(msg) {
  console.error('\nERROR: ' + msg + '\n');
  process.exit(1);
}

async function main() {
  const args = parseArgs(process.argv);

  // --- Validaciones ---
  const slug = (args.slug || '').trim();
  const name = (args.name || '').trim();
  const tables = args.tables !== undefined ? parseInt(args.tables, 10) : 10;
  const currency = (args.currency || 'CLP').trim().toUpperCase();
  const createCategories = !args['no-categories'];

  if (!slug) fail('Falta --slug. Ej: --slug=donpepe');
  if (!name) fail('Falta --name. Ej: --name="Don Pepe Parrilla"');

  if (!/^[a-z0-9-]+$/.test(slug)) {
    fail('El slug solo puede tener minusculas, numeros y guiones (sin espacios ni tildes). Recibido: "' + slug + '"');
  }

  if (!Number.isInteger(tables) || tables < 1 || tables > 200) {
    fail('--tables debe ser un entero entre 1 y 200. Recibido: "' + args.tables + '"');
  }

  if (!ALLOWED_CURRENCIES.includes(currency)) {
    fail('Moneda no soportada. Permitidas: ' + ALLOWED_CURRENCIES.join(', '));
  }

  // --- Chequear que el slug no exista ---
  const existing = await prisma.tenant.findUnique({ where: { slug } });
  if (existing) {
    fail('Ya existe un tenant con slug "' + slug + '". Elige otro.');
  }

  // --- Crear ---
  const adminKey = generateAdminKey();

  const tenant = await prisma.tenant.create({
    data: {
      slug,
      name,
      currency,
      adminKey,
      isActive: true,
      mpEnabled: false,
      settings: {
        create: { weekStartDay: 1 },
      },
    },
  });

  // Mesas
  await prisma.table.createMany({
    data: Array.from({ length: tables }, (_, i) => ({
      tenantId: tenant.id,
      number: i + 1,
      isActive: true,
    })),
  });

  // Categorias base
  if (createCategories) {
    await prisma.category.createMany({
      data: BASE_CATEGORIES.map((catName, idx) => ({
        tenantId: tenant.id,
        name: catName,
        sortOrder: idx,
        isActive: true,
      })),
    });
  }

  // Primera mesa (para armar URL de ejemplo)
  const firstTable = await prisma.table.findFirst({
    where: { tenantId: tenant.id, number: 1 },
    select: { id: true },
  });

  // --- Resumen ---
  console.log('\n========================================');
  console.log('  TENANT CREADO');
  console.log('========================================');
  console.log('  Nombre:    ' + tenant.name);
  console.log('  Slug:      ' + tenant.slug);
  console.log('  Moneda:    ' + tenant.currency);
  console.log('  Mesas:     ' + tables);
  console.log('  Categorias: ' + (createCategories ? BASE_CATEGORIES.join(', ') : '(ninguna)'));
  console.log('----------------------------------------');
  console.log('  ADMIN KEY (guardala, no se vuelve a mostrar):');
  console.log('  ' + adminKey);
  console.log('----------------------------------------');
  console.log('  Admin login: /es/' + slug + '/admin-login');
  if (firstTable) {
    console.log('  Cliente mesa 1: /es/' + slug + '/mesa/' + firstTable.id);
  }
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('\nFallo inesperado:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
