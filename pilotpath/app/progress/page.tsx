'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import NavBar from '@/components/NavBar';
import BottomNav from '@/components/BottomNav';
import ProgressRing from '@/components/ProgressRing';
import { computeReadiness, scoreColor } from '@/lib/scoring';
import type { Subject, UserProgress } from '@/lib/types';

export default function ProgressPage() {
  const { user, loading: authLoading } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { window.location.href = '/login'; return; }
    Promise.all([
      fetch('/api/subjects').then(r=>r.json()),
      fetch('/api/progress', { cache: 'no-store' }).then(r=>r.json()),
    ]).then(([subs, prog]) => {
      setSubjects(Array.isArray(subs) ? subs : []);
      setProgress(prog);
    }).finally(() => setLoading(false));
  }, [user, authLoading]);

  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh' }}><div style={{ color:'var(--muted)' }}>Loading…</div></div>;

  const totalQ    = subjects.reduce((s,sub)=>s+sub.questionCount, 0);
  const allAttempts = progress?.attempts ?? [];
  const readiness = computeReadiness(allAttempts, totalQ, progress?.questionsAttempted ?? 0);

  // Build last 30 days heatmap (days with any activity)
  const activityDays = new Set(
    allAttempts.map(a => new Date(a.completedAt).toISOString().slice(0,10))
  );
  const today = new Date();
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().slice(0,10);
  });

  return (
    <div className="app-shell">
      <NavBar streak={progress?.streak} />
      <div style={{ paddingBottom: 100 }}>
        <div style={{ background:'linear-gradient(180deg,var(--navy-mid) 0%,var(--navy) 100%)', padding:'24px 20px 20px' }}>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:22, fontWeight:700, color:'var(--white)', marginBottom:4 }}>Progress</div>
          <div style={{ fontSize:13, color:'var(--muted)' }}>Your study journey at a glance</div>
        </div>

        {/* Readiness ring */}
        <div className="progress-ring-wrap">
          <div className="progress-ring">
            <ProgressRing pct={readiness.score} size={150} strokeWidth={10} color="var(--blue)">
              <div className="prog-big">{readiness.score}%</div>
              <div className="prog-lbl">Readiness</div>
            </ProgressRing>
          </div>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:18, fontWeight:700, color:'var(--white)', marginBottom:4 }}>{readiness.label}</div>
          <div style={{ fontSize:12, color:'var(--muted)', textAlign:'center' }}>
            Coverage {readiness.coverage}% · Accuracy {readiness.accuracy}% · Mock avg {readiness.mockAvg}%
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, padding:'0 20px 20px' }}>
          {[
            { label:'Questions', value: progress?.questionsAttempted ?? 0, color:'#00D4AA' },
            { label:'Streak',    value: `${progress?.streak ?? 0}d`, color:'#F5A623' },
            { label:'Mocks',     value: allAttempts.filter(a=>a.type==='mock').length, color:'#4FB3E8' },
          ].map(s => (
            <div key={s.label} style={{ background:'var(--navy-card)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:'14px 10px', textAlign:'center' }}>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:22, fontWeight:700, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:10, color:'var(--muted)', marginTop:3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* 30-day activity heatmap */}
        <div style={{ padding:'0 20px', marginBottom:4 }}>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:14, fontWeight:600, color:'var(--white)', marginBottom:12 }}>30-Day Activity</div>
          <div className="heatmap-row">
            {last30.map(day => {
              const active = activityDays.has(day);
              return (
                <div key={day} className="heatmap-cell" title={day}
                  style={{ background: active ? 'rgba(0,212,170,0.3)' : 'rgba(255,255,255,0.05)', color: active ? '#00D4AA' : 'var(--muted)' }}>
                  {active ? '✓' : ''}
                </div>
              );
            })}
          </div>
        </div>

        {/* Per-subject accuracy */}
        <div style={{ padding:'16px 20px' }}>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:14, fontWeight:600, color:'var(--white)', marginBottom:12 }}>Subject Accuracy</div>
          {subjects.map(sub => {
            const subAttempts = allAttempts.filter(a => a.subjectId === sub.id);
            const acc = subAttempts.length > 0 ? Math.round(subAttempts.reduce((s,a)=>s+a.score,0)/subAttempts.length) : 0;
            return (
              <div key={sub.id} className="analysis-item">
                <div className="ai-header">
                  <span className="ai-chapter">{sub.icon} {sub.name}</span>
                  <span className="ai-pct" style={{ color: acc > 0 ? scoreColor(acc) : 'var(--muted)' }}>{acc > 0 ? `${acc}%` : '—'}</span>
                </div>
                {acc > 0 && <div className="ai-bar"><div className="ai-fill" style={{ width:`${acc}%`, background:scoreColor(acc) }} /></div>}
              </div>
            );
          })}
        </div>

        {/* Weak areas */}
        {readiness.weakChapters.length > 0 && (
          <div style={{ padding:'0 20px 20px' }}>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:14, fontWeight:600, color:'var(--white)', marginBottom:12 }}>Weak Areas to Review</div>
            {readiness.weakChapters.map(ch => (
              <div key={ch} style={{ background:'rgba(255,77,106,0.06)', border:'1px solid rgba(255,77,106,0.2)', borderRadius:'var(--r-sm)', padding:'10px 14px', marginBottom:8, display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ color:'#FF4D6A' }}>⚠</span>
                <span style={{ fontSize:13, color:'var(--white)' }}>{ch}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
