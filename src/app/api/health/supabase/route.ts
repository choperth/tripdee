import { NextResponse } from 'next/server';
import { checkSupabaseHealth } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const health = await checkSupabaseHealth();
    const status = health.connected ? 200 : 503;
    return NextResponse.json(health, { status });
  } catch (err) {
    return NextResponse.json(
      {
        connected: false,
        error: String(err),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
