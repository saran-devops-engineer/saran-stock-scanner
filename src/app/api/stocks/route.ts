import { NextResponse } from 'next/server';
import { AVAILABLE_INDEXES } from '@/data/lists';

export async function GET() {
  return NextResponse.json(AVAILABLE_INDEXES);
}
