import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'chartbank-analysis.json');
    if (!fs.existsSync(filePath)) {
      // Return empty data if file doesn't exist
      return NextResponse.json({
        summary: { totalPicks: 0, withReturns: 0, wins: 0, losses: 0, winRate: 0, avgReturn: 0, bestPick: null, worstPick: null },
        results: [],
      });
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
  }
}
