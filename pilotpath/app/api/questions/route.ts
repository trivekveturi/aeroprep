// GET /api/questions?subjectId=&chapterId=&limit=&shuffle=
import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/datasource';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const subjectId = searchParams.get('subjectId');
  if (!subjectId) return NextResponse.json({ error: 'subjectId required' }, { status: 400 });

  const chapterId  = searchParams.get('chapterId') ?? undefined;
  const limit      = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;
  const shuffle    = searchParams.get('shuffle') === 'true';

  try {
    const ds = getDataSource();
    const questions = await ds.getQuestions({ subjectId, chapterId, limit, shuffle });
    return NextResponse.json(questions);
  } catch (err) {
    console.error('GET /api/questions error:', err);
    return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 });
  }
}
