'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername]   = useState('');
  const [password, setPassword]   = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Login failed'); return; }
      // Start a fresh session — clears all previous answer stats
      const { startNewSession } = await import('@/lib/sessionStore');
      startNewSession(data.user?.id ?? data.user?.userId ?? 'user');
      window.location.href = '/dashboard';
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="onboard-screen" style={{ justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg,#1B6CA8,#4FB3E8)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, margin: '0 auto 16px' }}>✈</div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 700, color: 'var(--white)', marginBottom: 6 }}>PilotPath</div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>Your DGCA journey starts here</div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="field-label">Username</div>
        <div className={`input-wrap ${error ? 'error' : ''}`}>
          <input
            type="text" placeholder="your_username" autoComplete="username"
            value={username} onChange={e => setUsername(e.target.value)} required
          />
        </div>

        <div className="field-label">Password</div>
        <div className={`input-wrap ${error ? 'error' : ''}`}>
          <input
            type={showPw ? 'text' : 'password'} placeholder="••••••••"
            autoComplete="current-password"
            value={password} onChange={e => setPassword(e.target.value)} required
          />
          <button type="button" onClick={() => setShowPw(!showPw)} style={{ background: 'none', border: 'none', color: 'var(--sky)', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
            {showPw ? 'Hide' : 'Show'}
          </button>
        </div>

        {error && <div className="field-error" style={{ marginBottom: 12 }}>{error}</div>}

        <button className="cta-primary" type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Continue →'}
        </button>
      </form>

      <div className="or-divider">or sign in with</div>
      <button className="social-btn" onClick={() => alert('Google sign-in coming soon!')} type="button">
        <span style={{ fontWeight: 700 }}>G</span> Continue with Google
      </button>

      <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--muted)' }}>
        Don&apos;t have an account?{' '}
        <Link href="/register" style={{ color: 'var(--sky)', fontWeight: 600 }}>Register Free</Link>
      </div>
    </div>
  );
}
