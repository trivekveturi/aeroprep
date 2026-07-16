'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import type { Goal } from '@/lib/types';

const GOALS: { id: Goal; icon: string; title: string; desc: string }[] = [
  { id: 'pass-dgca',     icon: '📋', title: 'Pass DGCA Written Exams', desc: 'MCQ practice + Mock tests' },
  { id: 'airline-cadet', icon: '✈️', title: 'Get Airline Cadet Selected', desc: 'Aptitude + interview prep' },
  { id: 'classes',       icon: '🎓', title: 'Learn & Attend Classes', desc: 'Live & recorded lectures' },
  { id: 'explore',       icon: '🧭', title: 'Explore Aviation Career', desc: 'Guidance & mentorship' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selected, setSelected] = useState<Goal>('pass-dgca');
  const [loading, setLoading]   = useState(false);

  async function handleContinue() {
    setLoading(true);
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setGoal', goal: selected }),
      });
      router.push('/dashboard');
    } catch {
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="onboard-screen">
      <div style={{ marginBottom: 6, fontSize: 11, color: 'var(--sky)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Step 1 of 1</div>
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, color: 'var(--white)', marginBottom: 6 }}>
        Welcome, <span style={{ color: 'var(--sky)' }}>{user?.displayName?.split(' ')[0] ?? 'Pilot'}</span> ✈
      </div>
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 700, color: 'var(--white)', marginBottom: 6 }}>
        What&apos;s your <span style={{ color: 'var(--sky)' }}>main goal?</span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 28 }}>We&apos;ll build your personalised study plan.</div>

      {GOALS.map(goal => (
        <div
          key={goal.id}
          className={`goal-option ${selected === goal.id ? 'selected' : ''}`}
          onClick={() => setSelected(goal.id)}
          role="button" tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && setSelected(goal.id)}
          aria-pressed={selected === goal.id}
        >
          <span className="goal-icon">{goal.icon}</span>
          <div className="goal-info">
            <div className="goal-title">{goal.title}</div>
            <div className="goal-desc">{goal.desc}</div>
          </div>
          <div className="goal-check" aria-hidden="true">
            {selected === goal.id && '✓'}
          </div>
        </div>
      ))}

      <div style={{ flex: 1 }} />
      <button className="cta-primary" onClick={handleContinue} disabled={loading} style={{ marginTop: 24 }}>
        {loading ? 'Setting up…' : 'Set Up My Dashboard →'}
      </button>
    </div>
  );
}
