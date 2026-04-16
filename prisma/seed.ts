import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  console.log("Seeding database...");

  // Create tables
  for (const t of [
    { number: 1, label: "Salón" },
    { number: 2, label: "Salón" },
    { number: 3, label: "Terraza" },
    { number: 4, label: "Terraza" },
    { number: 5, label: "Bar" },
  ]) {
    const existing = await prisma.table.findUnique({ where: { number: t.number } });
    if (!existing) await prisma.table.create({ data: t });
  }

  const entradas = await prisma.category.upsert({
    where: { id: "cat-entradas" },
    update: {},
    create: { id: "cat-entradas", name: "Entradas", sortOrder: 1 },
  });

  const principales = await prisma.category.upsert({
    where: { id: "cat-principales" },
    update: {},
    create: { id: "cat-principales", name: "Platos principales", sortOrder: 2 },
  });

  const bebidas = await prisma.category.upsert({
    where: { id: "cat-bebidas" },
    update: {},
    create: { id: "cat-bebidas", name: "Bebidas", sortOrder: 3 },
  });

  const postres = await prisma.category.upsert({
    where: { id: "cat-postres" },
    update: {},
    create: { id: "cat-postres", name: "Postres", sortOrder: 4 },
  });

  const products = [
    { name: "Tabla de quesos", description: "Selección de quesos locales con mermelada y galletas", price: 8900, categoryId: entradas.id, sortOrder: 1 },
    { name: "Nachos con guacamole", description: "Nachos artesanales con guacamole fresco y salsa", price: 7500, categoryId: entradas.id, sortOrder: 2 },
    { name: "Alitas BBQ", description: "6 alitas de pollo con salsa BBQ casera", price: 9500, categoryId: entradas.id, sortOrder: 3 },
    { name: "Burger clásica", description: "Carne de vacuno, lechuga, tomate, cebolla y papas fritas", price: 12500, categoryId: principales.id, sortOrder: 1 },
    { name: "Burger doble cheese", description: "Doble carne, doble queso cheddar y papas fritas", price: 15900, categoryId: principales.id, sortOrder: 2 },
    { name: "Pasta al pesto", description: "Linguini con pesto de albahaca fresca y parmesano", price: 11000, categoryId: principales.id, sortOrder: 3 },
    { name: "Salmón a la plancha", description: "Filete de salmón con ensalada y papas al vapor", price: 18500, categoryId: principales.id, sortOrder: 4 },
    { name: "Cerveza artesanal", description: "500ml - lager, rubia o roja", price: 4500, categoryId: bebidas.id, sortOrder: 1 },
    { name: "Pisco Sour", description: "Preparado con pisco 40°, limón y clara de huevo", price: 5500, categoryId: bebidas.id, sortOrder: 2 },
    { name: "Agua mineral", description: "500ml con o sin gas", price: 1500, categoryId: bebidas.id, sortOrder: 3 },
    { name: "Jugo natural", description: "Naranja, piña o mango", price: 3500, categoryId: bebidas.id, sortOrder: 4 },
    { name: "Vino de la casa", description: "Copa 150ml - tinto o blanco", price: 4000, categoryId: bebidas.id, sortOrder: 5 },
    { name: "Tiramisú", description: "Clásico tiramisú italiano con cacao en polvo", price: 5500, categoryId: postres.id, sortOrder: 1 },
    { name: "Brownie con helado", description: "Brownie tibio de chocolate con helado de vainilla", price: 4900, categoryId: postres.id, sortOrder: 2 },
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name, categoryId: p.categoryId } });
    if (!existing) await prisma.product.create({ data: p });
  }

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
