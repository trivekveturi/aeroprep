'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [showPw, setShowPw]           = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, displayName, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Registration failed'); return; }
      // Start a fresh session for the new user
      const { startNewSession } = await import('@/lib/sessionStore');
      startNewSession(data.user?.id ?? data.user?.userId ?? 'user');
      window.location.href = '/onboarding';
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="onboard-screen">
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg,#1B6CA8,#4FB3E8)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 12px' }}>✈</div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, color: 'var(--white)', marginBottom: 4 }}>Create Account</div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>Free forever. No credit card.</div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="field-label">Full Name</div>
        <div className="input-wrap">
          <input type="text" placeholder="Arjun Kumar" autoComplete="name"
            value={displayName} onChange={e => setDisplayName(e.target.value)} required />
        </div>

        <div className="field-label">Username</div>
        <div className="input-wrap">
          <input type="text" placeholder="arjun_kumar" autoComplete="username"
            value={username} onChange={e => setUsername(e.target.value.replace(/\s/g,''))} required />
        </div>

        <div className="field-label">Password</div>
        <div className="input-wrap">
          <input
            type={showPw ? 'text' : 'password'} placeholder="Minimum 6 characters"
            autoComplete="new-password"
            value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
          />
          <button type="button" onClick={() => setShowPw(!showPw)} style={{ background: 'none', border: 'none', color: 'var(--sky)', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
            {showPw ? 'Hide' : 'Show'}
          </button>
        </div>

        {error && <div className="field-error" style={{ marginBottom: 12 }}>{error}</div>}

        <button className="cta-primary" type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Create Account →'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--muted)' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--sky)', fontWeight: 600 }}>Sign In</Link>
      </div>

      <div style={{ marginTop: 20, fontSize: 10, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
        By creating an account you agree to our Terms of Service.<br/>Your password is encrypted and never stored in plaintext.
      </div>
    </div>
  );
}
