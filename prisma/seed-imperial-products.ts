import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🍺 Cargando productos del Bar Imperial...\n')

  const imperial = await prisma.tenant.findUnique({
    where: { slug: 'imperial' },
  })

  if (!imperial) {
    throw new Error('Tenant "imperial" no encontrado. Corre primero el seed principal.')
  }

  // ============================================================
  // CATEGORÍAS
  // ============================================================
  const categoriesData = [
    { name: 'Hamburguesas', sortOrder: 1 },
    { name: 'Cervezas', sortOrder: 2 },
    { name: 'Picoteo', sortOrder: 3 },
  ]

  const categories: Record<string, string> = {}

  for (const cat of categoriesData) {
    // Buscar si ya existe
    const existing = await prisma.category.findFirst({
      where: { tenantId: imperial.id, name: cat.name },
    })

    if (existing) {
      categories[cat.name] = existing.id
      console.log(`   ↺ Categoría existente: ${cat.name}`)
    } else {
      const created = await prisma.category.create({
        data: {
          tenantId: imperial.id,
          name: cat.name,
          sortOrder: cat.sortOrder,
        },
      })
      categories[cat.name] = created.id
      console.log(`   ✓ Categoría creada: ${cat.name}`)
    }
  }

  // ============================================================
  // PRODUCTOS (precios reales de Uber Eats Bar Imperial)
  // ============================================================
  const productsData = [
    // Hamburguesas
    {
      category: 'Hamburguesas',
      name: 'Burger Imperial',
      description: 'Hamburguesa, lechuga, tomate, cebolla morada, queso y pepinillo.',
      price: 10900,
      sortOrder: 1,
    },
    {
      category: 'Hamburguesas',
      name: 'Burger BBQ Tocino',
      description: 'Hamburguesa, cebolla caramelizada, queso cheddar, tocino y salsa BBQ.',
      price: 10900,
      sortOrder: 2,
    },
    // Cervezas
    {
      category: 'Cervezas',
      name: 'Original Summer Ale',
      description: 'Cerveza fresca y veraniega. 4.0% / 20 IBU.',
      price: 4500,
      sortOrder: 1,
    },
    {
      category: 'Cervezas',
      name: 'Original English Pale Ale',
      description: 'Clásica inglesa de la casa. 5.6% / 35 IBU.',
      price: 4500,
      sortOrder: 2,
    },
    {
      category: 'Cervezas',
      name: 'Original IPA Cheetara',
      description: 'IPA lupulada de la casa. 6.0% / 55 IBU.',
      price: 5000,
      sortOrder: 3,
    },
    // Picoteo
    {
      category: 'Picoteo',
      name: 'Canasto Fritanga',
      description: 'Empanadas de queso, aros de cebolla, papas fritas y salsa de la casa.',
      price: 8500,
      sortOrder: 1,
    },
    {
      category: 'Picoteo',
      name: 'Sanguchito Crudo Palta Mayo',
      description: 'Marraqueta crujiente con crudo, palta y mayo + papas fritas.',
      price: 10900,
      sortOrder: 2,
    },
  ]

  for (const p of productsData) {
    const categoryId = categories[p.category]
    const existing = await prisma.product.findFirst({
      where: { tenantId: imperial.id, name: p.name },
    })

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          description: p.description,
          price: p.price,
          categoryId,
          sortOrder: p.sortOrder,
        },
      })
      console.log(`   ↺ Producto actualizado: ${p.name}`)
    } else {
      await prisma.product.create({
        data: {
          tenantId: imperial.id,
          categoryId,
          name: p.name,
          description: p.description,
          price: p.price,
          sortOrder: p.sortOrder,
          isAvailable: true,
        },
      })
      console.log(`   ✓ Producto creado: ${p.name}`)
    }
  }

  console.log('\n🎉 Catálogo del Imperial listo.')
  console.log(`   ${Object.keys(categories).length} categorías, ${productsData.length} productos\n`)
}

main()
  .catch((e) => {
    console.error('❌ Seed falló:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
