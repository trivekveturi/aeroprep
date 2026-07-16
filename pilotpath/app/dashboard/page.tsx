'use client';
/**
 * Dashboard — all stats come from the CURRENT LOGIN SESSION only.
 * sessionStore (sessionStorage) tracks answers in real-time.
 * Numbers reset when the user logs out and logs back in.
 * No DB reads for stats — DB is only used for streak & goal.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import NavBar from '@/components/NavBar';
import BottomNav from '@/components/BottomNav';
import ProgressRing from '@/components/ProgressRing';
import { scoreColor } from '@/lib/scoring';
import { getSessionSummary, initSession, startNewSession } from '@/lib/sessionStore';
import type { Subject, UserProgress } from '@/lib/types';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [subjects,     setSubjects]    = useState<Subject[]>([]);
  const [progress,     setProgress]    = useState<UserProgress | null>(null);
  const [dataLoading,  setDataLoading] = useState(true);
  const [sessionStats, setSessionStats] = useState(() => getSessionSummary());

  useEffect(() => {
    if (authLoading) return;
    if (!user) { window.location.href = '/login'; return; }

    // Ensure the session belongs to this user. If the stored session
    // has no ID or belongs to a different user, start fresh.
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem('pp_sess_id') : '';
    if (!stored || !stored.startsWith(user.userId ?? '')) {
      startNewSession(user.userId ?? user.id ?? '');
    }
    setSessionStats(getSessionSummary());

    Promise.all([
      fetch('/api/subjects').then(r => r.json()),
      fetch('/api/progress', { cache: 'no-store' }).then(r => r.json()),
    ]).then(([subs, prog]) => {
      setSubjects(Array.isArray(subs) ? subs : []);
      setProgress(prog);
    }).finally(() => setDataLoading(false));
  }, [user, authLoading]);

  if (authLoading || dataLoading) return <LoadingScreen />;

  // ── Session stats (live, current login only) ──────────────────
  const { total: sessTotal, correct: sessCorrect, wrong: sessWrong,
          accuracy: sessAccuracy, weakSubjects } = sessionStats;

  // Per-subject accuracy from session
  const subjectAcc = (id: string): number | null => {
    const s = sessionStats.subjectBreakdown[id];
    if (!s || s.total === 0) return null;
    return Math.round((s.correct / s.total) * 100);
  };

  // Readiness score from session
  const totalQ         = subjects.reduce((s, sub) => s + sub.questionCount, 0);
  const coverage       = totalQ > 0 ? Math.min(100, Math.round((sessTotal / totalQ) * 100)) : 0;
  const readinessScore = Math.round((coverage * 0.4) + (sessAccuracy * 0.6));
  const readinessLabel = readinessScore >= 85 ? 'Ready to Fly'
    : readinessScore >= 70 ? 'Almost Ready'
    : readinessScore >= 50 ? 'On Track'
    : readinessScore >= 25 ? 'Building Base'
    : 'Just Starting';

  const streak    = progress?.streak ?? 0;
  const firstName = user?.displayName?.split(' ')[0] ?? 'Pilot';

  return (
    <div className="app-shell">
      <NavBar streak={streak} />

      {/* ── MOBILE LAYOUT ── */}
      <div className="mobile-only" style={{ paddingBottom: 80 }}>
        <div className="dash-hero">
          <div className="dash-greeting">Good morning,</div>
          <div className="dash-name">{user?.displayName} ✈</div>
          <div className="dash-subtitle">
            {progress?.goal === 'pass-dgca' ? 'CPL candidate' : 'Aviation student'}
            {streak > 0 ? ` · ${streak}-day streak` : ''}
          </div>

          {/* Readiness gauge */}
          <div className="readiness-card">
            <ProgressRing pct={readinessScore} size={72} strokeWidth={6} color="var(--blue)">
              <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:18, fontWeight:700, color:'var(--white)' }}>{readinessScore}</span>
              <span style={{ fontSize:8, color:'var(--muted)' }}>%</span>
            </ProgressRing>
            <div>
              <div className="readiness-label">Exam Readiness</div>
              <div className="readiness-title">{readinessLabel}</div>
              {weakSubjects.length > 0
                ? <div className="readiness-weak">Weak: {weakSubjects.slice(0,2).map(id => subjects.find(s=>s.id===id)?.name ?? id).join(', ')}</div>
                : <div className="readiness-weak">{sessTotal > 0 ? 'Good progress!' : 'Start practising to see insights'}</div>
              }
              <Link href="/progress" className="readiness-link">View full report →</Link>
            </div>
          </div>
        </div>

        {/* Instrument cards */}
        <div className="section-heading-row" style={{ marginTop:16 }}>
          <div className="section-heading-label">This Session</div>
        </div>
        <div className="instrument-row">
          <InstrumentCard value={sessTotal}    unit="Qs" label="Answered"     delta={sessTotal > 0 ? `${sessCorrect} correct` : 'Start now'}         color="#00D4AA" />
          <InstrumentCard value={sessAccuracy} unit="%" label="Accuracy"      delta={sessTotal > 0 ? (sessAccuracy >= 75 ? '✓ Pass level' : 'Need 75%') : 'No data'} color="#F5A623" />
          <InstrumentCard value={sessWrong}         label="Wrong"             delta={sessWrong > 0 ? 'Review them' : sessTotal > 0 ? 'Perfect!' : '—'} color="#FF4D6A" />
          <InstrumentCard value={streak}            label="Day streak"        delta={streak > 0 ? '🔥 Keep it up' : 'Come daily'}                      color="#4FB3E8" />
        </div>

        {/* Quick actions */}
        <div className="section-heading-row">
          <div className="section-heading-label">Jump back in</div>
        </div>
        <div className="quick-actions" style={{ marginTop:10 }}>
          <Link href="/practice" className="action-card" style={{ background:'linear-gradient(135deg,rgba(27,108,168,0.3),rgba(27,108,168,0.08))' }}>
            <div className="icon">📝</div><div className="title">Practice</div><div className="desc">Pick a subject</div>
            <div className="action-arrow">›</div>
          </Link>
          <Link href="/mock" className="action-card" style={{ background:'linear-gradient(135deg,rgba(245,166,35,0.2),rgba(245,166,35,0.05))' }}>
            <div className="icon">⏱</div><div className="title">Mock Test</div><div className="desc">Timed session</div>
            <div className="action-arrow">›</div>
          </Link>
          <Link href="/classes" className="action-card" style={{ background:'linear-gradient(135deg,rgba(255,77,106,0.2),rgba(255,77,106,0.05))' }}>
            <div className="icon">🎓</div><div className="title">Classes</div><div className="desc">Coming soon</div>
            <div className="action-arrow">›</div>
          </Link>
          <Link href="/cadet" className="action-card" style={{ background:'linear-gradient(135deg,rgba(0,212,170,0.2),rgba(0,212,170,0.05))' }}>
            <div className="icon">🎯</div><div className="title">Cadet Prep</div><div className="desc">Coming soon</div>
            <div className="action-arrow">›</div>
          </Link>
        </div>

        {/* Subjects */}
        <div className="subjects-section" style={{ paddingTop:16 }}>
          <div className="subjects-header">
            <div className="sec-heading">Your Subjects</div>
            <Link href="/practice" className="see-all">See all →</Link>
          </div>
          {subjects.map(sub => {
            const acc  = subjectAcc(sub.id);
            const done = sessionStats.subjectBreakdown[sub.id]?.total ?? 0;
            const pct  = sub.questionCount > 0 ? Math.min(100, Math.round(done/sub.questionCount*100)) : 0;
            return (
              <Link key={sub.id} href={`/practice/${sub.id}`} className="subject-card">
                <div className="subj-icon" style={{ background:`${sub.color}1A` }}>{sub.icon}</div>
                <div className="subj-info">
                  <div className="subj-name">{sub.name}</div>
                  <div className="subj-meta">{done > 0 ? `${done} answered this session` : 'Not started yet'}</div>
                  <div className="subj-progress-bar">
                    <div className="subj-progress-fill" style={{ width:`${pct}%`, background:sub.color }} />
                  </div>
                </div>
                <div className="subj-score">
                  <div className="score-pct" style={{ color: acc !== null ? scoreColor(acc) : 'var(--muted)' }}>
                    {acc !== null ? `${acc}%` : '—'}
                  </div>
                  <div className="score-lbl">accuracy</div>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="bottom-nav-spacer" />
      </div>

      {/* ── WEB LAYOUT ── */}
      <div className="web-only web-content">
        <div className="web-top-bar">
          <div>
            <div className="web-greeting">Good morning, {firstName} ✈</div>
            <div className="web-sub">
              {sessTotal > 0
                ? `${sessTotal} answered this session · ${sessAccuracy}% accuracy`
                : `${subjects.length} subjects available · Start practising`}
            </div>
          </div>
          <div className="web-actions">
            <Link href="/practice"><button className="wb-btn secondary">📋 Practice</button></Link>
            <Link href="/mock"><button className="wb-btn primary">⏱ Start Mock Test</button></Link>
          </div>
        </div>

        {/* Stat cards — live session data */}
        <div className="web-grid">
          <div className="web-stat-card" style={{ '--accent':'#00D4AA' } as React.CSSProperties}>
            <div className="wsc-label">Questions Answered</div>
            <div className="wsc-value" style={{ color:'#00D4AA' }}>{sessTotal}</div>
            <div className="wsc-delta" style={{ color:'#00D4AA' }}>
              {sessTotal > 0 ? `${sessCorrect} correct · ${sessWrong} wrong` : 'Start practising'}
            </div>
          </div>
          <div className="web-stat-card" style={{ '--accent':'#4FB3E8' } as React.CSSProperties}>
            <div className="wsc-label">Session Accuracy</div>
            <div className="wsc-value" style={{ color:'#4FB3E8' }}>{sessTotal > 0 ? `${sessAccuracy}%` : '—'}</div>
            <div className="wsc-delta" style={{ color: sessAccuracy >= 75 ? '#00D4AA' : 'var(--muted)' }}>
              {sessTotal > 0 ? (sessAccuracy >= 75 ? '✓ Above DGCA pass mark' : 'Pass mark is 75%') : 'No answers yet'}
            </div>
          </div>
          <div className="web-stat-card" style={{ '--accent':'#F5A623' } as React.CSSProperties}>
            <div className="wsc-label">Exam Readiness</div>
            <div className="wsc-value" style={{ color:'#F5A623' }}>{readinessScore}%</div>
            <div className="wsc-delta" style={{ color:'var(--muted)' }}>{readinessLabel}</div>
          </div>
        </div>

        {/* Readiness detail bar */}
        <div style={{ background:'var(--navy-card)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:'18px 20px', marginBottom:24, display:'flex', alignItems:'center', gap:20 }}>
          <ProgressRing pct={readinessScore} size={80} strokeWidth={7} color="var(--blue)">
            <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:20, fontWeight:700, color:'var(--white)' }}>{readinessScore}%</span>
          </ProgressRing>
          <div>
            <div style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:4 }}>Exam Readiness</div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:18, fontWeight:700, color:'var(--white)', marginBottom:6 }}>{readinessLabel}</div>
            <div style={{ fontSize:12, color:'var(--muted)' }}>
              Coverage {coverage}% · Accuracy {sessAccuracy}%
              {weakSubjects.length > 0 && ` · Weak: ${weakSubjects.slice(0,2).map(id=>subjects.find(s=>s.id===id)?.name??id).join(', ')}`}
            </div>
          </div>
          <div style={{ marginLeft:'auto' }}>
            <Link href="/progress"><button className="wb-btn secondary" style={{ fontSize:12 }}>View Full Report →</button></Link>
          </div>
        </div>

        {/* Subject grid */}
        <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:15, fontWeight:600, color:'var(--white)', marginBottom:14 }}>DGCA Subjects</div>
        <div className="web-exam-grid">
          {subjects.map(sub => {
            const acc  = subjectAcc(sub.id);
            const done = sessionStats.subjectBreakdown[sub.id]?.total ?? 0;
            const pct  = sub.questionCount > 0 ? Math.min(100, Math.round(done/sub.questionCount*100)) : 0;
            return (
              <Link key={sub.id} href={`/practice/${sub.id}`} className="web-subj-card">
                <div className="wsc-icon" style={{ background:`${sub.color}1A` }}>{sub.icon}</div>
                <div className="wsc-name">{sub.name}</div>
                <div className="wsc-qs">
                  {sub.questionCount} questions{sub.chapters ? ` · ${sub.chapters.length} chapters` : ''}
                  {done > 0 && <span style={{ color:sub.color, marginLeft:6 }}>· {done} answered</span>}
                </div>
                <div className="wsc-bar"><div className="wsc-bar-fill" style={{ width:`${pct}%`, background:sub.color }} /></div>
                <div className="wsc-score-badge" style={{ color: acc !== null ? scoreColor(acc) : 'var(--muted)' }}>
                  {acc !== null ? `${acc}%` : '—'}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Session summary */}
        {sessTotal === 0 && (
          <div style={{ textAlign:'center', padding:'32px 0', color:'var(--muted)' }}>
            No answers yet this session —{' '}
            <Link href="/practice" style={{ color:'var(--sky)' }}>start practising now</Link>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function InstrumentCard({ value, unit, label, delta, color }: {
  value: number; unit?: string; label: string; delta: string; color: string;
}) {
  return (
    <div className="instrument-card" style={{ '--accent-color': color } as React.CSSProperties}>
      <div className="inst-value">{value}{unit && <span className="inst-unit">{unit}</span>}</div>
      <div className="inst-label">{label}</div>
      <div className="inst-delta" style={{ color }}>{delta}</div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:40 }}>✈</div>
      <div style={{ color:'var(--muted)', fontSize:14 }}>Loading…</div>
    </div>
  );
}
