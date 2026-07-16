// POST /api/auth/login — verify credentials, set session cookie
import { NextRequest, NextResponse } from 'next/server';
import { getUserStore } from '@/lib/UserStore';
import { createSessionToken, buildSetCookieHeader } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    const store = getUserStore();
    const user = await store.findByUsername(username);
    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const valid = await store.verifyPassword(user, password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

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
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
