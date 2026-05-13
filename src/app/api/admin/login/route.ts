import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAdminSession } from '@/lib/admin-session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantSlug, adminKey } = body ?? {};

    if (!tenantSlug || typeof tenantSlug !== 'string') {
      return NextResponse.json({ error: 'tenantSlug requerido' }, { status: 400 });
    }
    if (!adminKey || typeof adminKey !== 'string') {
      return NextResponse.json({ error: 'adminKey requerido' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, slug: true, adminKey: true, isActive: true },
    });

    if (!tenant || !tenant.isActive) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    if (tenant.adminKey !== adminKey) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    await createAdminSession(tenant.id, tenant.slug);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('admin/login error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
