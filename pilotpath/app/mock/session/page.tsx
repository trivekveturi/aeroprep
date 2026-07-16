'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import QuestionPillSlider from '@/components/QuestionPillSlider';
import ProgressRing from '@/components/ProgressRing';
import { calculateScore, scoreColor } from '@/lib/scoring';
import type { Question, Subject } from '@/lib/types';
import { Suspense } from 'react';

// TODO: make timer server-authoritative (track start time server-side, verify on submit)

type AnswerState = 'unanswered' | 'correct' | 'wrong';
interface QState { question: Question; selected: string | null; flagged: boolean; }

function MockSessionInner() {
  const { user, loading: authLoading } = useAuth();
  const router  = useRouter();
  const params  = useSearchParams();
  const subjectId = params.get('subjectId') ?? 'all';
  const DEFAULT_COUNT = 60;
  const DEFAULT_TIME  = 60 * 60; // 60 min in seconds

  const [questions, setQuestions] = useState<QState[]>([]);
  const [current, setCurrent]     = useState(0);
  const [subject, setSubject]     = useState<Subject | null>(null);
  const [loading, setLoading]     = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [timeLeft, setTimeLeft]   = useState(DEFAULT_TIME);
  const startTime = useRef(Date.now());
  const timerRef  = useRef<ReturnType<typeof setInterval>|null>(null);

  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (submitted) return;
    setSubmitted(true);
    if (timerRef.current) clearInterval(timerRef.current);
    setSaving(true);

    const duration = Math.round((Date.now() - startTime.current) / 1000);
    const answered = questions.filter(q => q.selected !== null);
    const correct  = answered.filter(q => q.selected?.trim() === q.question.correct_answer.trim()).length;
    const wrong    = answered.length - correct;
    const total    = questions.length;
    const score    = calculateScore(correct, total);

    const chapterBreakdown: Record<string, { correct: number; total: number }> = {};
    for (const q of questions) {
      const ch = q.question.chapter;
      if (!ch) continue;
      if (!chapterBreakdown[ch]) chapterBreakdown[ch] = { correct:0, total:0 };
      chapterBreakdown[ch].total++;
      if (q.selected?.trim() === q.question.correct_answer.trim()) chapterBreakdown[ch].correct++;
    }

    const attempt = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      subjectId: subjectId === 'all' ? questions[0]?.question.id.split('-')[0] ?? 'mixed' : subjectId,
      type: 'mock' as const,
      score, correct, wrong, skipped: total - answered.length,
      total, durationSeconds: duration,
      completedAt: new Date().toISOString(),
      chapterBreakdown: Object.keys(chapterBreakdown).length > 0 ? chapterBreakdown : undefined,
    };

    await fetch('/api/progress', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action:'saveAttempt', attempt }),
    }).catch(() => {});

    setSaving(false);
    router.push(`/results?score=${score}&correct=${correct}&wrong=${wrong}&total=${total}&subjectId=${subjectId}&type=mock&duration=${duration}`);
  }, [questions, subjectId, submitted, router]);

  // Timer
  useEffect(() => {
    if (loading || submitted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { handleSubmit(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [loading, submitted, handleSubmit]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { window.location.href = '/login'; return; }

    const count = DEFAULT_COUNT;
    const url = subjectId === 'all'
      ? `/api/mock?count=${count}`
      : `/api/mock?subjectId=${subjectId}&count=${count}`;

    Promise.all([
      fetch(url).then(r => r.json()),
      subjectId !== 'all' ? fetch('/api/subjects').then(r=>r.json()).then((s:Subject[]) => s.find(x=>x.id===subjectId)??null) : Promise.resolve(null),
    ]).then(([qs, sub]) => {
      if (Array.isArray(qs)) setQuestions(qs.map((q:Question) => ({ question:q, selected:null, flagged:false })));
      setSubject(sub);
    }).finally(() => setLoading(false));
  }, [user, authLoading, subjectId]);

  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh' }}><div style={{ color:'var(--muted)' }}>Building mock test…</div></div>;
  if (questions.length === 0) return <div style={{ textAlign:'center',padding:40,color:'var(--muted)' }}>No questions found for this mock test. <a href="/mock" style={{ color:'var(--sky)' }}>Go back</a></div>;

  const q = questions[current];
  const LETTERS = ['A','B','C','D','E','F'];
  const answered  = questions.filter(x => x.selected !== null).length;
  const flagged   = questions.filter(x => x.flagged).length;
  const mm = String(Math.floor(timeLeft/60)).padStart(2,'0');
  const ss = String(timeLeft%60).padStart(2,'0');
  const timerColor = timeLeft < 300 ? '#FF4D6A' : 'var(--amber)';

  return (
    <div style={{ minHeight:'100vh', background:'var(--navy)' }}>
      {/* Header */}
      <div className="web-mock-header" style={{ background:'#0F1E35', padding:'12px 20px', borderBottom:'1px solid rgba(75,130,190,0.15)', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
        <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:15, fontWeight:700, color:'var(--white)' }}>
          {subject?.name ?? 'Full Mock'} — Mock Test
        </div>
        <div style={{ background:'rgba(79,179,232,0.1)', border:'1px solid rgba(79,179,232,0.2)', borderRadius:20, padding:'4px 14px', fontSize:12, color:'var(--sky)', fontWeight:600 }}>
          {questions.length} Questions
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:20 }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:9, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.07em' }}>Time Remaining</div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:22, fontWeight:700, color:timerColor }}>{mm}:{ss}</div>
          </div>
          <button
            style={{ background:'var(--green)', color:'var(--navy)', border:'none', borderRadius:8, padding:'10px 22px', fontSize:13, fontWeight:700, cursor:'pointer' }}
            onClick={() => handleSubmit(false)} disabled={saving || submitted}
          >{saving ? 'Saving…' : 'Submit Test'}</button>
        </div>
      </div>

      {/* Question pill slider — shown above everything on all screen sizes */}
      <QuestionPillSlider
        total={questions.length}
        current={current}
        getStatus={idx => {
          if (idx === current) return 'current';
          if (questions[idx].flagged) return 'flagged';
          if (questions[idx].selected !== null) return 'answered';
          return 'unanswered';
        }}
        onSelect={setCurrent}
      />

      {/* Three-col web / single-col mobile */}
      <div className="web-mock-layout" style={{ display:'grid' }}>
        {/* Sidebar */}
        <div className="web-mock-sidebar">
          <div style={{ fontSize:10, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>Question Grid</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:5, marginBottom:16 }}>
            {questions.map((_, idx) => {
              let bg = 'var(--navy-card)', color = 'var(--muted)', border = 'var(--border)';
              if (idx === current) { bg='var(--blue)'; color='#fff'; border=`var(--blue)`; }
              else if (questions[idx].flagged) { bg='rgba(245,166,35,0.15)'; color='#F5A623'; border='rgba(245,166,35,0.35)'; }
              else if (questions[idx].selected !== null) { bg='rgba(0,212,170,0.15)'; color='#00D4AA'; border='rgba(0,212,170,0.35)'; }
              return (
                <div key={idx} onClick={() => setCurrent(idx)} style={{ width:30,height:30,borderRadius:6,background:bg,border:`1px solid ${border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:600,color,cursor:'pointer' }}>
                  {idx+1}
                </div>
              );
            })}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6, fontSize:11, color:'var(--muted)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}><div style={{ width:12,height:12,borderRadius:3,background:'rgba(0,212,170,0.15)',border:'1px solid rgba(0,212,170,0.35)' }} />Answered ({answered})</div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}><div style={{ width:12,height:12,borderRadius:3,background:'var(--blue)' }} />Current</div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}><div style={{ width:12,height:12,borderRadius:3,background:'rgba(245,166,35,0.15)',border:'1px solid rgba(245,166,35,0.35)' }} />Flagged ({flagged})</div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}><div style={{ width:12,height:12,borderRadius:3,background:'var(--navy-card)',border:'1px solid var(--border)' }} />Unanswered</div>
          </div>
        </div>

        {/* Main */}
        <div className="web-mock-main">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:13, fontWeight:600, color:'var(--sky)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
              Question {current+1}{q.question.chapter ? ` · ${q.question.chapter}` : ''}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button
                style={{ background:'transparent', border:`1px solid ${q.flagged?'rgba(245,166,35,0.5)':'rgba(245,166,35,0.3)'}`, borderRadius:6, padding:'5px 12px', fontSize:12, color: q.flagged ? 'var(--amber)' : 'var(--muted)', cursor:'pointer' }}
                onClick={() => { const u=[...questions]; u[current]={...q,flagged:!q.flagged}; setQuestions(u); }}
              >🚩 {q.flagged ? 'Flagged' : 'Flag for review'}</button>
            </div>
          </div>

          <div style={{ fontSize:16, fontWeight:500, lineHeight:1.7, color:'var(--white)', marginBottom:28 }}>
            {q.question.question}
          </div>

          {q.question.options.map((opt, i) => (
            <div
              key={i}
              className={`option ${q.selected === opt ? 'answered' : ''}`}
              style={{ padding:'15px 20px', marginBottom:10,
                borderColor: q.selected === opt ? 'var(--blue)' : undefined,
                background:  q.selected === opt ? 'rgba(27,108,168,0.12)' : undefined,
              }}
              onClick={() => { const u=[...questions]; u[current]={...q,selected:opt}; setQuestions(u); }}
            >
              <div className="option-letter" style={q.selected===opt?{background:'var(--blue)',color:'var(--white)',borderColor:'var(--blue)'}:{}}>{LETTERS[i]}</div>
              <div className="option-text" style={{ fontSize:14 }}>{opt}</div>
            </div>
          ))}

          <div style={{ display:'flex', justifyContent:'space-between', marginTop:24 }}>
            <button className="enav-btn" style={{ flex:'0 0 auto', padding:'0 24px' }} onClick={() => setCurrent(c=>Math.max(0,c-1))} disabled={current===0}>‹ Previous</button>
            <button className="enav-btn danger" style={{ flex:'0 0 auto', padding:'0 24px' }} onClick={() => { const u=[...questions]; u[current]={...q,selected:null}; setQuestions(u); }}>Reset</button>
            {current < questions.length-1
              ? <button className="enav-btn primary" style={{ flex:'0 0 auto', padding:'0 28px' }} onClick={() => setCurrent(c=>c+1)}>Next ›</button>
              : <button className="enav-btn primary" style={{ flex:'0 0 auto', padding:'0 28px' }} onClick={() => handleSubmit(false)} disabled={saving}>Submit ✓</button>
            }
          </div>
        </div>

        {/* Right panel */}
        <div className="web-mock-panel">
          <div style={{ fontSize:10, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:16 }}>Live Progress</div>
          <ProgressRing pct={Math.round(answered/questions.length*100)} size={100} strokeWidth={8} color="#00D4AA">
            <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:22, fontWeight:700, color:'#00D4AA' }}>{answered}</span>
            <span style={{ fontSize:10, color:'var(--muted)' }}>of {questions.length}</span>
          </ProgressRing>
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:16 }}>
            {[['Answered',answered,'#00D4AA'],['Flagged',flagged,'#F5A623'],['Remaining',questions.length-answered,'var(--white)']].map(([l,v,c])=>(
              <div key={l as string} style={{ background:'var(--navy-card)', borderRadius:8, padding:'10px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:11, color:'var(--muted)' }}>{l}</span>
                <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:16, fontWeight:700, color:c as string }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop:16, fontSize:10, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Keyboard</div>
          {[['A–D','Select answer'],['→','Next question'],['F','Flag / unflag']].map(([k,d])=>(
            <div key={k} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, fontSize:11, color:'#4A5A70' }}>
              <kbd style={{ background:'var(--navy-card)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:3, padding:'1px 5px', fontSize:10 }}>{k}</kbd>{d}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile pill row for small screens */}
      <div className="mobile-only" style={{ position:'fixed', bottom:0, left:0, right:0, background:'rgba(11,22,40,0.97)', backdropFilter:'blur(20px)', borderTop:'1px solid var(--border)', padding:'10px 16px 20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:11, color:'var(--muted)' }}>{answered}/{questions.length} answered</span>
          <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:14, fontWeight:700, color:timerColor }}>{mm}:{ss}</span>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button className="enav-btn" onClick={() => setCurrent(c=>Math.max(0,c-1))} disabled={current===0} style={{ flex:1 }}>‹ Back</button>
          <button className={`enav-btn ${q.flagged?'danger':''}`} onClick={() => { const u=[...questions]; u[current]={...q,flagged:!q.flagged}; setQuestions(u); }} style={{ flex:'0 0 44px' }}>🚩</button>
          {current < questions.length-1
            ? <button className="enav-btn primary" onClick={() => setCurrent(c=>c+1)} style={{ flex:1 }}>Next ›</button>
            : <button className="enav-btn primary" onClick={() => handleSubmit(false)} disabled={saving} style={{ flex:1 }}>Submit</button>
          }
        </div>
      </div>
    </div>
  );
}

export default function MockSessionPage() {
  return (
    <Suspense fallback={<div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh' }}><div style={{ color:'var(--muted)' }}>Loading…</div></div>}>
      <MockSessionInner />
    </Suspense>
  );
}
