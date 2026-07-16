'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import NavBar from '@/components/NavBar';
import BottomNav from '@/components/BottomNav';
import type { Subject, UserProgress } from '@/lib/types';
import { scoreColor } from '@/lib/scoring';
import { cleanChapterDisplay } from '@/lib/chapterUtils';

export default function SubjectChaptersPage() {
  const { user, loading: authLoading } = useAuth();
  const params    = useParams<{ subjectId: string }>();
  const subjectId = params.subjectId;

  const [subject,  setSubject]  = useState<Subject | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { window.location.href = '/login'; return; }
    Promise.all([
      fetch('/api/subjects').then(r => r.json()).then((subs: Subject[]) => subs.find(s => s.id === subjectId) ?? null),
      fetch('/api/progress').then(r => r.json()),
    ]).then(([sub, prog]) => {
      setSubject(sub);
      setProgress(prog);
    }).finally(() => setLoading(false));
  }, [user, authLoading, subjectId]);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <div style={{ color:'var(--muted)' }}>Loading…</div>
    </div>
  );
  if (!subject) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:48 }}>📭</div>
      <div style={{ color:'var(--muted)' }}>Subject not found</div>
      <Link href="/practice" style={{ color:'var(--sky)' }}>← Back</Link>
    </div>
  );

  const attempts      = progress?.attempts ?? [];
  const subAttempts   = attempts.filter(a => a.subjectId === subjectId);
  const doneTotalQs   = subAttempts.reduce((s, a) => s + a.total, 0);
  const chapters      = subject.chapters ?? [];

  // Per-chapter stats from attempt chapter breakdowns
  const chapterStats: Record<string, { correct: number; total: number }> = {};
  for (const a of subAttempts) {
    if (!a.chapterBreakdown) continue;
    for (const [ch, stats] of Object.entries(a.chapterBreakdown)) {
      if (!chapterStats[ch]) chapterStats[ch] = { correct: 0, total: 0 };
      chapterStats[ch].correct += stats.correct;
      chapterStats[ch].total   += stats.total;
    }
  }

  return (
    <div className="app-shell">
      <NavBar />
      <div style={{ paddingBottom: 100, minHeight: '100vh' }}>

        {/* Breadcrumb */}
        <div style={{ padding:'12px 20px', borderBottom:'1px solid var(--border)', background:'var(--navy-mid)', fontSize:13, color:'var(--muted)', display:'flex', alignItems:'center', gap:8 }}>
          <Link href="/practice" style={{ color:'var(--sky)', textDecoration:'none' }}>Practice</Link>
          <span style={{ color:'var(--border)' }}>›</span>
          <span style={{ color:'var(--white)' }}>{subject.name}</span>
        </div>

        {/* Subject header card */}
        <div style={{ margin:'20px 20px 0', background:'var(--navy-card)', border:`1px solid var(--border)`, borderLeft:`4px solid ${subject.color}`, borderRadius:'var(--r-md)', padding:'16px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:44, height:44, borderRadius:'var(--r-sm)', background:`${subject.color}1A`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
              {subject.icon}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:16, fontWeight:700, color:'var(--white)', marginBottom:3 }}>
                {subject.name}
                <span style={{ marginLeft:10, background:'rgba(79,179,232,0.1)', border:'1px solid rgba(79,179,232,0.2)', borderRadius:12, padding:'2px 10px', fontSize:11, color:'var(--sky)', fontWeight:600 }}>
                  {chapters.length} chapters
                </span>
              </div>
              <div style={{ fontSize:12, color:'var(--muted)' }}>
                {doneTotalQs} / {subject.questionCount} questions done
              </div>
            </div>
            {/* Overall progress bar */}
            <div style={{ width:80, textAlign:'right', flexShrink:0 }}>
              <div style={{ fontSize:18, fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", color: subject.color }}>
                {subject.questionCount > 0 ? Math.min(100, Math.round(doneTotalQs / subject.questionCount * 100)) : 0}%
              </div>
              <div style={{ fontSize:10, color:'var(--muted)' }}>done</div>
            </div>
          </div>
          {/* Overall progress bar */}
          <div style={{ height:4, background:'rgba(255,255,255,0.07)', borderRadius:2, marginTop:12, overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:2, background:subject.color, width:`${Math.min(100, Math.round(doneTotalQs/subject.questionCount*100))}%`, transition:'width 0.5s' }} />
          </div>
        </div>

        {/* Chapter list */}
        <div style={{ padding:'16px 20px' }}>
          {chapters.length === 0 ? (
            /* No chapters — go straight to all questions */
            <div style={{ textAlign:'center', padding:'24px 0' }}>
              <div style={{ color:'var(--muted)', fontSize:13, marginBottom:16 }}>This subject has no chapters — all questions in one set.</div>
              <Link href={`/practice/${subjectId}/all`}>
                <button style={{ background:'var(--blue)', color:'var(--white)', border:'none', borderRadius:'var(--r-sm)', padding:'12px 32px', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                  Start Practice →
                </button>
              </Link>
            </div>
          ) : chapters.map((ch, idx) => {
            const stats  = chapterStats[ch];
            const acc    = stats && stats.total > 0 ? Math.round(stats.correct / stats.total * 100) : null;
            const done   = stats?.total ?? 0;

            return (
              <div key={ch} style={{
                background:'var(--navy-card)', border:'1px solid var(--border)',
                borderRadius:'var(--r-md)', padding:'14px 16px', marginBottom:10,
                display:'flex', alignItems:'center', gap:12
              }}>
                {/* Index icon */}
                <div style={{
                  width:34, height:34, borderRadius:8, flexShrink:0,
                  background: done > 0 ? `${subject.color}1A` : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${done > 0 ? subject.color + '40' : 'rgba(255,255,255,0.08)'}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:16
                }}>
                  {done > 0 ? '✓' : '🔒'}
                </div>

                {/* Chapter name + stats */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--white)', marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {cleanChapterDisplay(ch)}
                  </div>
                  <div style={{ fontSize:11, color:'var(--muted)' }}>
                    {done > 0 ? `${done} attempted` : 'Not started'}
                    {acc !== null && <span style={{ marginLeft:8, color: scoreColor(acc), fontWeight:600 }}>{acc}% accuracy</span>}
                  </div>
                </div>

                {/* CS (Practice) button */}
                <Link href={`/practice/${subjectId}/${encodeURIComponent(ch)}`}>
                  <button style={{
                    background:'rgba(245,166,35,0.1)', border:'1px solid rgba(245,166,35,0.35)',
                    borderRadius:8, padding:'6px 14px', fontSize:12, fontWeight:700,
                    color:'var(--amber)', cursor:'pointer', display:'flex', alignItems:'center', gap:5,
                    whiteSpace:'nowrap'
                  }}>
                    ⚡ Practice
                  </button>
                </Link>

                {/* Mock (Assignment) button */}
                <Link href={`/mock/session?subjectId=${subjectId}&chapter=${encodeURIComponent(ch)}`}>
                  <button style={{
                    background:'rgba(79,179,232,0.1)', border:'1px solid rgba(79,179,232,0.3)',
                    borderRadius:8, padding:'6px 14px', fontSize:12, fontWeight:700,
                    color:'var(--sky)', cursor:'pointer', display:'flex', alignItems:'center', gap:5,
                    whiteSpace:'nowrap'
                  }}>
                    📋 Mock
                  </button>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
