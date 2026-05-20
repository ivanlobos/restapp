import { NextRequest, NextResponse } from 'next/server';
import { clearAdminSession } from '@/lib/admin-session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantSlug } = body ?? {};

    if (!tenantSlug || typeof tenantSlug !== 'string') {
      return NextResponse.json({ error: 'tenantSlug requerido' }, { status: 400 });
    }

    await clearAdminSession(tenantSlug);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('admin/logout error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
