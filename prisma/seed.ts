import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

function generateAdminKey(): string {
  return crypto.randomBytes(32).toString('hex')
}

async function main() {
  console.log('🌱 Seeding database...\n')

  // ============================================================
  // TENANT 1: BAR IMPERIAL (cliente real, primera visita 24/05)
  // ============================================================
  const imperialAdminKey = generateAdminKey()
  
  const imperial = await prisma.tenant.create({
    data: {
      slug: 'imperial',
      name: 'Bar Imperial',
      address: 'Maipú, Santiago',
      phone: null,
      mercadoPagoToken: null, // se carga después desde admin
      adminKey: imperialAdminKey,
      isActive: true,
      settings: {
        create: {
          weekStartDay: 1,
        },
      },
    },
  })

  // 12 mesas placeholder, sin label (se ajustan desde admin)
  await prisma.table.createMany({
    data: Array.from({ length: 12 }, (_, i) => ({
      tenantId: imperial.id,
      number: i + 1,
      isActive: true,
    })),
  })

  console.log('✅ Tenant creado: Bar Imperial')
  console.log(`   slug: imperial`)
  console.log(`   adminKey: ${imperialAdminKey}`)
  console.log(`   admin URL: /imperial/admin?key=${imperialAdminKey}`)
  console.log(`   12 mesas creadas (sin label)\n`)

  // ============================================================
  // TENANT 2: DEMO (para desarrollo y testing)
  // ============================================================
  const demoAdminKey = generateAdminKey()

  const demo = await prisma.tenant.create({
    data: {
      slug: 'demo',
      name: 'Demo Restaurant',
      address: 'Restaurante de prueba',
      phone: null,
      mercadoPagoToken: process.env.MP_ACCESS_TOKEN || null,
      adminKey: demoAdminKey,
      isActive: true,
      settings: {
        create: {
          weekStartDay: 1,
        },
      },
    },
  })

  // 5 mesas para demo
  await prisma.table.createMany({
    data: Array.from({ length: 5 }, (_, i) => ({
      tenantId: demo.id,
      number: i + 1,
      label: `Mesa ${i + 1}`,
      isActive: true,
    })),
  })

  // Categorías de ejemplo
  const cervezas = await prisma.category.create({
    data: {
      tenantId: demo.id,
      name: 'Cervezas',
      sortOrder: 1,
    },
  })

  const comida = await prisma.category.create({
    data: {
      tenantId: demo.id,
      name: 'Comida',
      sortOrder: 2,
    },
  })

  // Productos de ejemplo
  await prisma.product.createMany({
    data: [
      {
        tenantId: demo.id,
        categoryId: cervezas.id,
        name: 'IPA Artesanal',
        description: 'Lúpulo intenso, 6.5% ABV',
        price: 4500,
        sortOrder: 1,
      },
      {
        tenantId: demo.id,
        categoryId: cervezas.id,
        name: 'Stout',
        description: 'Cerveza negra, notas a café',
        price: 4500,
        sortOrder: 2,
      },
      {
        tenantId: demo.id,
        categoryId: comida.id,
        name: 'Hamburguesa Clásica',
        description: 'Carne 200g, queso, lechuga, tomate',
        price: 8900,
        sortOrder: 1,
      },
      {
        tenantId: demo.id,
        categoryId: comida.id,
        name: 'Papas Fritas',
        description: 'Porción grande',
        price: 3500,
        sortOrder: 2,
      },
    ],
  })

  console.log('✅ Tenant creado: Demo Restaurant')
  console.log(`   slug: demo`)
  console.log(`   adminKey: ${demoAdminKey}`)
  console.log(`   admin URL: /demo/admin?key=${demoAdminKey}`)
  console.log(`   5 mesas + 2 categorías + 4 productos\n`)

  console.log('🎉 Seed completado.\n')
  console.log('⚠️  GUARDÁ LAS ADMIN KEYS EN UN LUGAR SEGURO')
  console.log('   (también podés verlas en Prisma Studio en cualquier momento)\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed falló:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
