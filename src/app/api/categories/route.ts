import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        where: { isAvailable: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const body = await req.json();
  const category = await prisma.category.create({
    data: { name: body.name, sortOrder: body.sortOrder ?? 0 },
  });
  return NextResponse.json(category, { status: 201 });
}
