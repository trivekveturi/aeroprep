// GET /api/progress — get current user's progress
// POST /api/progress/attempt — save an attempt
import { NextRequest, NextResponse } from 'next/server';
import { getProgressStore } from '@/lib/ProgressStore';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  try {
    const store = getProgressStore();
    const progress = await store.getProgress(session.userId);
    return NextResponse.json(progress);
  } catch (err) {
    console.error('GET /api/progress error:', err);
    return NextResponse.json({ error: 'Failed to load progress' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  try {
    const body = await req.json();
    const { action } = body;
    const store = getProgressStore();

    if (action === 'saveAttempt') {
      await store.saveAttempt(session.userId, body.attempt);
      return NextResponse.json({ ok: true });
    }

    if (action === 'setGoal') {
      await store.updateGoal(session.userId, body.goal);
      return NextResponse.json({ ok: true });
    }

    if (action === 'flagQuestion') {
      await store.flagQuestion(session.userId, body.questionId);
      return NextResponse.json({ ok: true });
    }

    if (action === 'unflagQuestion') {
      await store.unflagQuestion(session.userId, body.questionId);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('POST /api/progress error:', err);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
