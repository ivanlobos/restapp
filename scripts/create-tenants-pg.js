/**
 * Crea tenants Piu Pizza y Black Mamba Coffee directamente via pg
 * Sin Prisma — usa SQL puro.
 */
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const TENANTS = [
  {
    slug: 'piu-pizza',
    name: 'Piu Pizza',
    adminKey: 'b5b67809-bed7-4654-8c4b-757c6e289bda',
    tables: 8,
    currency: 'CLP',
    categories: ['Pizzas', 'Entradas', 'Bebidas', 'Postres'],
  },
  {
    slug: 'black-mamba',
    name: 'Black Mamba Coffee',
    adminKey: 'b208065b-6aa4-4859-8020-15324651b85c',
    tables: 8,
    currency: 'CLP',
    categories: ['Cafés', 'Alimentos', 'Bebidas Frías', 'Postres'],
  },
];

async function createTenant(client, { slug, name, adminKey, tables, currency, categories }) {
  // Verificar si ya existe
  const existing = await client.query('SELECT id FROM "Tenant" WHERE slug = $1', [slug]);
  if (existing.rows.length > 0) {
    console.log(`⚠️  Ya existe "${slug}" (id: ${existing.rows[0].id}). Saltando.`);
    return;
  }

  // Crear tenant
  const tenantRes = await client.query(
    `INSERT INTO "Tenant" (slug, name, currency, "adminKey", "isActive", "mpEnabled", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, true, false, NOW(), NOW())
     RETURNING id`,
    [slug, name, currency, adminKey]
  );
  const tenantId = tenantRes.rows[0].id;

  // Crear settings
  await client.query(
    `INSERT INTO "TenantSettings" ("tenantId", "weekStartDay", "createdAt", "updatedAt")
     VALUES ($1, 1, NOW(), NOW())`,
    [tenantId]
  );

  // Crear mesas
  for (let i = 1; i <= tables; i++) {
    await client.query(
      `INSERT INTO "Table" ("tenantId", number, "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, true, NOW(), NOW())`,
      [tenantId, i]
    );
  }

  // Crear categorías
  for (let idx = 0; idx < categories.length; idx++) {
    await client.query(
      `INSERT INTO "Category" ("tenantId", name, "sortOrder", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, true, NOW(), NOW())`,
      [tenantId, categories[idx], idx]
    );
  }

  // Obtener primera mesa para URL de ejemplo
  const tableRes = await client.query(
    `SELECT id FROM "Table" WHERE "tenantId" = $1 AND number = 1`,
    [tenantId]
  );
  const firstTableId = tableRes.rows[0]?.id;

  console.log('\n========================================');
  console.log('  TENANT CREADO ✅');
  console.log('========================================');
  console.log(`  Nombre:    ${name}`);
  console.log(`  Slug:      ${slug}`);
  console.log(`  ID:        ${tenantId}`);
  console.log(`  Mesas:     ${tables}`);
  console.log(`  Categorías: ${categories.join(', ')}`);
  console.log('----------------------------------------');
  console.log(`  Admin:     https://userestapp.cl/es/${slug}/admin`);
  if (firstTableId) {
    console.log(`  Mesa 1:    https://userestapp.cl/es/${slug}/mesa/${firstTableId}`);
  }
  console.log('========================================\n');
}

async function main() {
  const client = await pool.connect();
  try {
    console.log('🚀 Conectando a Supabase...\n');

    // Verificar tablas disponibles
    const tablesCheck = await client.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
    );
    console.log('Tablas en DB:', tablesCheck.rows.map(r => r.tablename).join(', '));
    console.log('');

    for (const tenant of TENANTS) {
      await createTenant(client, tenant);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
