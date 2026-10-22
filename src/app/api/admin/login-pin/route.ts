import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAdminSession } from '@/lib/admin-session';
import bcrypt from 'bcryptjs';

// Login por username + PIN para usuarios KITCHEN y BAR
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantSlug, username, pin } = body ?? {};

    if (!tenantSlug || !username || !pin) {
      return NextResponse.json({ error: 'tenantSlug, username y pin son requeridos' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, slug: true, isActive: true },
    });

    if (!tenant || !tenant.isActive) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 401 });
    }

    const user = await prisma.adminUser.findUnique({
      where: { tenantId_username: { tenantId: tenant.id, username } },
    });

    if (!user || !user.isActive) {
      console.error('login-pin: user not found', { tenantId: tenant.id, username, userFound: !!user });
      return NextResponse.json({ error: 'Credenciales inválidas', debug: { tenantId: tenant.id, username } }, { status: 401 });
    }

    const isValid = await bcrypt.compare(pin, user.pin);
    if (!isValid) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    await createAdminSession(tenant.id, tenant.slug, user.role, user.id);

    return NextResponse.json({ ok: true, role: user.role });
  } catch (err) {
    console.error('admin/login-pin error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
