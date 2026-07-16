'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import NavBar from '@/components/NavBar';
import BottomNav from '@/components/BottomNav';
import { scoreColor } from '@/lib/scoring';
import type { Subject, UserProgress } from '@/lib/types';

export default function PracticePage() {
  const { user, loading: authLoading } = useAuth();
  const [subjects, setSubjects]   = useState<Subject[]>([]);
  const [progress, setProgress]   = useState<UserProgress | null>(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { window.location.href = '/login'; return; }
    Promise.all([
      fetch('/api/subjects').then(r => r.json()),
      fetch('/api/progress').then(r => r.json()),
    ]).then(([subs, prog]) => {
      setSubjects(Array.isArray(subs) ? subs : []);
      setProgress(prog);
    }).finally(() => setLoading(false));
  }, [user, authLoading]);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <div style={{ color:'var(--muted)' }}>Loading…</div>
    </div>
  );

  const allAttempts = progress?.attempts ?? [];

  return (
    <div className="app-shell">
      <NavBar />
      <div style={{ paddingBottom: 100 }}>
        {/* Header */}
        <div style={{ background:'linear-gradient(180deg,var(--navy-mid) 0%,var(--navy) 100%)', padding:'24px 20px 20px' }}>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, color:'var(--white)', marginBottom: 6 }}>Practice Mode</div>
          <div style={{ fontSize: 13, color:'var(--muted)' }}>Select a subject to start practising</div>
        </div>

        {/* Subject list */}
        <div style={{ padding:'16px 20px' }}>
          {subjects.length === 0 && (
            <div style={{ textAlign:'center', padding:'40px 0', color:'var(--muted)' }}>
              No subjects found. Check DATA_DIR in .env.local
            </div>
          )}
          {subjects.map(sub => {
            const subAttempts = allAttempts.filter(a => a.subjectId === sub.id);
            const acc  = subAttempts.length > 0 ? Math.round(subAttempts.reduce((s,a)=>s+a.score,0)/subAttempts.length) : 0;
            const done = subAttempts.reduce((s,a)=>s+a.total, 0);
            const pct  = sub.questionCount > 0 ? Math.min(100, Math.round(done/sub.questionCount*100)) : 0;
            return (
              <Link key={sub.id} href={`/practice/${sub.id}`} className="subject-card">
                <div className="subj-icon" style={{ background:`${sub.color}1A` }}>{sub.icon}</div>
                <div className="subj-info">
                  <div className="subj-name">{sub.name}</div>
                  <div className="subj-meta">{sub.questionCount} questions{sub.chapters ? ` · ${sub.chapters.length} chapters` : ''}</div>
                  <div className="subj-progress-bar">
                    <div className="subj-progress-fill" style={{ width:`${pct}%`, background:sub.color }} />
                  </div>
                </div>
                <div className="subj-score">
                  <div className="score-pct" style={{ color: acc > 0 ? scoreColor(acc) : 'var(--muted)' }}>{acc > 0 ? `${acc}%` : '—'}</div>
                  <div className="score-lbl">accuracy</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
