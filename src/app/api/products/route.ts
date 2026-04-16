import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");

  const products = await prisma.product.findMany({
    where: categoryId ? { categoryId } : undefined,
    orderBy: { sortOrder: "asc" },
    include: { category: true },
  });
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const body = await req.json();
  const product = await prisma.product.create({
    data: {
      name: body.name,
      description: body.description || null,
      price: Number(body.price),
      categoryId: body.categoryId,
      imageUrl: body.imageUrl || null,
      sortOrder: body.sortOrder ?? 0,
    },
    include: { category: true },
  });
  return NextResponse.json(product, { status: 201 });
}
