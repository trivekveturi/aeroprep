// GET /api/mock?subjectId=&count=60 — build a mock test question set
import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/datasource';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const subjectId = searchParams.get('subjectId') ?? undefined;
  const count = Math.min(Number(searchParams.get('count') ?? 60), 200);

  try {
    const ds = getDataSource();
    const questions = await ds.getMockTest({ subjectId, count });
    return NextResponse.json(questions);
  } catch (err) {
    console.error('GET /api/mock error:', err);
    return NextResponse.json({ error: 'Failed to build mock test' }, { status: 500 });
  }
}
