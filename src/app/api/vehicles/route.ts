import { NextResponse } from 'next/server';
import { fetchVehicles } from '@/lib/supabase/service';

export async function GET() {
  try {
    const vehicles = await fetchVehicles();
    return NextResponse.json({
      success: true,
      total: vehicles.length,
      vehicles,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch vehicles', details: String(err) },
      { status: 500 }
    );
  }
}
