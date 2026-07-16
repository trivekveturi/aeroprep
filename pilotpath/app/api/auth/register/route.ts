// POST /api/auth/register — create account, set session cookie
import { NextRequest, NextResponse } from 'next/server';
import { getUserStore } from '@/lib/UserStore';
import { getProgressStore } from '@/lib/ProgressStore';
import { createSessionToken, buildSetCookieHeader } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const { username, displayName, password } = await req.json();

    if (!username || !password || !displayName) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    if (username.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });
    }

    const store = getUserStore();
    const user = await store.create({ username, displayName, password });

    // Initialise empty progress record
    const progressStore = getProgressStore();
    await progressStore.getProgress(user.id); // creates default file

    const token = await createSessionToken({
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
    });

    const res = NextResponse.json({
      user: { id: user.id, username: user.username, displayName: user.displayName }
    });
    res.headers.set('Set-Cookie', buildSetCookieHeader(token));
    return res;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Registration failed';
    return NextResponse.json({ error: msg }, { status: 409 });
  }
}
