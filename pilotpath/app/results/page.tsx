'use client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import BottomNav from '@/components/BottomNav';
import ProgressRing from '@/components/ProgressRing';
import { scoreColor, scoreLabel } from '@/lib/scoring';
import { Suspense } from 'react';

function ResultsInner() {
  const params  = useSearchParams();
  const score   = Number(params.get('score') ?? 0);
  const correct = Number(params.get('correct') ?? 0);
  const wrong   = Number(params.get('wrong') ?? 0);
  const total   = Number(params.get('total') ?? 0);
  const subjectId = params.get('subjectId') ?? '';
  const type    = params.get('type') ?? 'practice';
  const duration = Number(params.get('duration') ?? 0);

  const color   = scoreColor(score);
  const label   = scoreLabel(score);
  const skipped = total - correct - wrong;
  const mins    = Math.floor(duration/60);
  const secs    = duration % 60;

  return (
    <div className="app-shell">
      <NavBar />
      <div style={{ paddingBottom: 100 }}>

        {/* Hero */}
        <div className="results-hero">
          <div className="result-badge">
            {score >= 75 ? '✓ Test Complete' : '📋 Attempt Recorded'}
          </div>
          <div className="result-score-ring">
            <ProgressRing pct={score} size={120} strokeWidth={10} color={color}>
              <div className="result-pct" style={{ color }}>{score}%</div>
              <div className="result-label">Score</div>
            </ProgressRing>
          </div>
          <div className="result-subject-name">{label}</div>
          <div className="result-meta">
            {correct} correct · {wrong} wrong{skipped > 0 ? ` · ${skipped} skipped` : ''}
            {duration > 0 && ` · ${mins}m ${secs}s`}
          </div>
        </div>

        {/* Stats */}
        <div className="result-stats">
          <div className="rstat">
            <div className="rstat-val" style={{ color:'#00D4AA' }}>{correct}</div>
            <div className="rstat-lbl">Correct</div>
          </div>
          <div className="rstat">
            <div className="rstat-val" style={{ color:'#FF4D6A' }}>{wrong}</div>
            <div className="rstat-lbl">Wrong</div>
          </div>
          <div className="rstat">
            <div className="rstat-val" style={{ color }}>{score}%</div>
            <div className="rstat-lbl">Score</div>
          </div>
        </div>

        {/* Result message */}
        <div style={{ padding:'0 20px 20px' }}>
          <div style={{ background:'var(--navy-card)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:'16px 20px', marginBottom:12 }}>
            {score >= 85 && <><div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:15, fontWeight:700, color:'#00D4AA', marginBottom:6 }}>Outstanding! 🏆</div><div style={{ fontSize:13, color:'var(--muted)' }}>You&apos;re performing above the DGCA pass mark. Keep this momentum going!</div></>}
            {score >= 75 && score < 85 && <><div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:15, fontWeight:700, color:'#4FB3E8', marginBottom:6 }}>Good work! ✈</div><div style={{ fontSize:13, color:'var(--muted)' }}>You&apos;re above the passing threshold. Review the questions you missed to push higher.</div></>}
            {score >= 60 && score < 75 && <><div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:15, fontWeight:700, color:'#F5A623', marginBottom:6 }}>Getting there 📈</div><div style={{ fontSize:13, color:'var(--muted)' }}>You&apos;re close to the pass mark. Focus on your weak areas and try again.</div></>}
            {score < 60 && <><div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:15, fontWeight:700, color:'#FF4D6A', marginBottom:6 }}>Keep practising 💪</div><div style={{ fontSize:13, color:'var(--muted)' }}>Review the explanations for the questions you got wrong. Each wrong answer is a learning opportunity.</div></>}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {subjectId && subjectId !== 'all' && (
              <Link href={`/practice/${subjectId}`}>
                <button style={{ width:'100%', height:46, borderRadius:10, background:'var(--blue)', border:'none', color:'var(--white)', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  📝 Practise {type === 'mock' ? 'This Subject' : 'Again'}
                </button>
              </Link>
            )}
            {type === 'mock' && subjectId && (
              <Link href={`/mock/session?subjectId=${subjectId}`}>
                <button style={{ width:'100%', height:46, borderRadius:10, background:'transparent', border:'1px solid rgba(255,255,255,0.12)', color:'var(--white)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                  🔁 Retry This Mock
                </button>
              </Link>
            )}
            <Link href="/dashboard">
              <button style={{ width:'100%', height:46, borderRadius:10, background:'transparent', border:'1px solid var(--border)', color:'var(--muted)', fontSize:13, fontWeight:500, cursor:'pointer' }}>
                ← Back to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh' }}><div style={{ color:'var(--muted)' }}>Loading results…</div></div>}>
      <ResultsInner />
    </Suspense>
  );
}
