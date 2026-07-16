'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import NavBar from '@/components/NavBar';
import BottomNav from '@/components/BottomNav';
import type { Subject, UserProgress } from '@/lib/types';
import { scoreColor } from '@/lib/scoring';

export default function MockListPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { window.location.href = '/login'; return; }
    Promise.all([
      fetch('/api/subjects').then(r=>r.json()),
      fetch('/api/progress').then(r=>r.json()),
    ]).then(([subs, prog]) => {
      setSubjects(Array.isArray(subs) ? subs : []);
      setProgress(prog);
    }).finally(() => setLoading(false));
  }, [user, authLoading]);

  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh' }}><div style={{ color:'var(--muted)' }}>Loading…</div></div>;

  const allAttempts = progress?.attempts ?? [];
  const mockAttempts = allAttempts.filter(a => a.type === 'mock');

  return (
    <div className="app-shell">
      <NavBar />
      <div style={{ paddingBottom: 100 }}>
        {/* Header */}
        <div style={{ background:'linear-gradient(180deg,var(--navy-mid) 0%,var(--navy) 100%)', padding:'24px 20px 20px' }}>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:22, fontWeight:700, color:'var(--white)', marginBottom:6 }}>Mock Tests</div>
          <div style={{ fontSize:13, color:'var(--muted)' }}>Timed exam simulation · {mockAttempts.length} completed</div>
        </div>

        <div style={{ padding:'16px 20px' }}>
          {/* All subjects mock */}
          <div className="mock-row" onClick={() => router.push('/mock/session?subjectId=all')}>
            <div className="mock-icon">✈</div>
            <div className="mock-info">
              <div className="mock-name">Full DGCA Mock — All Subjects</div>
              <div className="mock-meta">Up to 60 questions · <span>60 min</span></div>
            </div>
            <button className="start-mock-btn">Start →</button>
          </div>

          {/* Per-subject mocks */}
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:15, fontWeight:600, color:'var(--white)', margin:'20px 0 12px' }}>Subject Mocks</div>
          {subjects.map(sub => {
            const last = mockAttempts.filter(a => a.subjectId === sub.id).slice(-1)[0];
            const count = Math.min(60, sub.questionCount);
            return (
              <div key={sub.id} className="mock-row" onClick={() => router.push(`/mock/session?subjectId=${sub.id}`)}>
                <div className="mock-icon" style={{ background:`${sub.color}1A` }}>{sub.icon}</div>
                <div className="mock-info">
                  <div className="mock-name">{sub.name}</div>
                  <div className="mock-meta">{count} questions · <span>{count} min</span></div>
                </div>
                {last ? (
                  <div className="mock-score">
                    <div className="score" style={{ color: scoreColor(last.score) }}>{last.score}%</div>
                    <div className="label">last score</div>
                  </div>
                ) : (
                  <button className="start-mock-btn">Start →</button>
                )}
              </div>
            );
          })}

          {/* Past attempts */}
          {mockAttempts.length > 0 && (
            <>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:15, fontWeight:600, color:'var(--white)', margin:'20px 0 12px' }}>Past Attempts</div>
              {mockAttempts.slice().reverse().slice(0,5).map(a => {
                const sub = subjects.find(s => s.id === a.subjectId);
                return (
                  <Link key={a.id} href={`/results?score=${a.score}&correct=${a.correct}&wrong=${a.wrong}&total=${a.total}&subjectId=${a.subjectId}&type=mock`} className="mock-row">
                    <div className="mock-icon">{sub?.icon ?? '📋'}</div>
                    <div className="mock-info">
                      <div className="mock-name">{sub?.name ?? 'All Subjects'} Mock</div>
                      <div className="mock-meta">{a.total}Q · {Math.round(a.durationSeconds/60)}min · <span>{new Date(a.completedAt).toLocaleDateString()}</span></div>
                    </div>
                    <div className="mock-score">
                      <div className="score" style={{ color: scoreColor(a.score) }}>{a.score}%</div>
                      <div className="label">score</div>
                    </div>
                  </Link>
                );
              })}
            </>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
