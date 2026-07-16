'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import NavBar from '@/components/NavBar';
import BottomNav from '@/components/BottomNav';
import QuestionPillSlider from '@/components/QuestionPillSlider';
import { calculateScore } from '@/lib/scoring';
import type { Question, Subject } from '@/lib/types';
import { cleanChapterDisplay } from '@/lib/chapterUtils';
import { recordAnswer } from '@/lib/sessionStore';

type AnswerState = 'unanswered' | 'correct' | 'wrong';
interface QuestionState {
  question: Question;
  selected: string | null;
  state: AnswerState;
  flagged: boolean;
}

export default function ChapterPracticePage() {
  const { user, loading: authLoading } = useAuth();
  const params    = useParams<{ subjectId: string; chapter: string }>();
  const router    = useRouter();
  const subjectId = params.subjectId;
  const chapter   = decodeURIComponent(params.chapter);

  const [subject, setSubject] = useState<Subject | null>(null);
  const [qs, setQs]           = useState<QuestionState[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { window.location.href = '/login'; return; }
    Promise.all([
      fetch('/api/subjects').then(r => r.json()).then((subs: Subject[]) => subs.find(s => s.id === subjectId) ?? null),
      fetch(`/api/questions?subjectId=${subjectId}&chapterId=${encodeURIComponent(chapter)}&shuffle=false`).then(r => r.json()),
    ]).then(([sub, questions]) => {
      setSubject(sub);
      if (Array.isArray(questions)) {
        setQs(questions.map((q: Question) => ({ question: q, selected: null, state: 'unanswered', flagged: false })));
      }
    }).finally(() => setLoading(false));
  }, [user, authLoading, subjectId, chapter]);

  function handleAnswer(option: string) {
    const q = qs[current];
    if (q.state !== 'unanswered') return;
    const isCorrect = option.trim() === q.question.correct_answer.trim();
    const updated = [...qs];
    updated[current] = { ...q, selected: option, state: isCorrect ? 'correct' : 'wrong' };
    setQs(updated);

    // Record in session store — live dashboard stats
    recordAnswer(q.question.id, subjectId, isCorrect, q.question.chapter);

    if (!isCorrect) {
      fetch('/api/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'flagQuestion', questionId: q.question.id }) }).catch(() => {});
    }
  }

  async function handleFinish() {
    setSaving(true);
    const correct = qs.filter(q => q.state === 'correct').length;
    const wrong   = qs.filter(q => q.state === 'wrong').length;
    const total   = qs.length;
    const score   = calculateScore(correct, total);
    const chapterBreakdown: Record<string, { correct: number; total: number }> = {};
    for (const q of qs) {
      if (q.question.chapter) {
        const ch = q.question.chapter;
        if (!chapterBreakdown[ch]) chapterBreakdown[ch] = { correct: 0, total: 0 };
        chapterBreakdown[ch].total++;
        if (q.state === 'correct') chapterBreakdown[ch].correct++;
      }
    }
    await fetch('/api/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveAttempt', attempt: {
        id: crypto.randomUUID(), subjectId, type: 'practice', score, correct, wrong,
        skipped: total - correct - wrong, total, durationSeconds: 0,
        completedAt: new Date().toISOString(),
        chapterBreakdown: Object.keys(chapterBreakdown).length > 0 ? chapterBreakdown : undefined,
      }})
    });
    setSaving(false);
    router.push(`/results?score=${score}&correct=${correct}&wrong=${wrong}&total=${total}&subjectId=${subjectId}&type=practice`);
  }

  function toggleFlag() {
    const updated = [...qs];
    const q = updated[current];
    updated[current] = { ...q, flagged: !q.flagged };
    setQs(updated);
    fetch('/api/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: q.flagged ? 'unflagQuestion' : 'flagQuestion', questionId: q.question.id }) }).catch(() => {});
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <div style={{ color:'var(--muted)' }}>Loading questions…</div>
    </div>
  );
  if (qs.length === 0) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', flexDirection:'column', gap:16, padding:24, textAlign:'center' }}>
      <div style={{ fontSize:48 }}>📭</div>
      <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:20, fontWeight:700, color:'var(--white)' }}>No questions in this chapter</div>
      <Link href={`/practice/${subjectId}`} style={{ color:'var(--sky)' }}>← Back to chapters</Link>
    </div>
  );

  const q        = qs[current];
  const LETTERS  = ['A','B','C','D','E','F'];

  return (
    <div className="app-shell">
      <NavBar />
      <div style={{ paddingBottom: 100, minHeight: '100vh' }}>

        {/* Header */}
        <div className="exam-header">
          <div>
            <div className="exam-subject-tag">{subject?.name ?? subjectId}</div>
            <div style={{ fontSize:10, color:'var(--muted)', marginTop:3 }}>{cleanChapterDisplay(chapter)}</div>
          </div>
          <div style={{ fontSize:12, color:'var(--muted)' }}>Practice Mode</div>
          <button className="submit-btn" onClick={handleFinish} disabled={saving}>
            {saving ? 'Saving…' : 'Finish'}
          </button>
        </div>

        {/* Question pill slider with prev/next arrows */}
        <QuestionPillSlider
          total={qs.length}
          current={current}
          getStatus={idx => {
            if (idx === current) return 'current';
            if (qs[idx].flagged) return 'flagged';
            if (qs[idx].state === 'correct') return 'answered';
            if (qs[idx].state === 'wrong') return 'wrong';
            return 'unanswered';
          }}
          onSelect={setCurrent}
        />

        {/* Answered / remaining stats bar */}
        <div style={{
          display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'6px 16px', background:'rgba(27,108,168,0.05)',
          borderBottom:'1px solid var(--border)', fontSize:11
        }}>
          <span style={{ color:'#00D4AA', fontWeight:600 }}>
            {qs.filter(x => x.state !== 'unanswered').length} Answered
          </span>
          <span style={{ color:'var(--muted)' }}>
            Question {current + 1} of {qs.length}
          </span>
          <span style={{ color:'var(--muted)' }}>
            {qs.length - qs.filter(x => x.state !== 'unanswered').length} remaining
          </span>
        </div>

        {/* Question */}
        <div className="question-area">
          <div className="q-number-row">
            <div className="q-number">Q{current+1} · {cleanChapterDisplay(chapter)}</div>
            <button className={`q-flag-btn ${q.flagged ? 'flagged' : ''}`} onClick={toggleFlag}>
              🚩 {q.flagged ? 'Flagged' : 'Flag'}
            </button>
          </div>
          <div className="q-text">{q.question.question}</div>

          {q.question.options.map((opt, i) => {
            let cls = 'option';
            if (q.selected === opt) cls += q.state === 'correct' ? ' selected-correct' : ' selected-wrong';
            else if (q.state !== 'unanswered' && opt.trim() === q.question.correct_answer.trim()) cls += ' correct-answer';
            else if (q.state !== 'unanswered') cls += ' disabled';
            return (
              <div key={i} className={cls} onClick={() => handleAnswer(opt)} role="button" tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && handleAnswer(opt)}>
                <div className="option-letter">{LETTERS[i]}</div>
                <div className="option-text">{opt}</div>
              </div>
            );
          })}

          {/* Explanation — always show after answering, even if no text in DB */}
          {q.state !== 'unanswered' && (
            <div className={`explanation-box ${q.state === 'wrong' ? 'wrong' : ''}`}>
              <div className="exp-header">
                {q.state === 'correct' ? '✓ Correct!' : '✗ Incorrect'}
                {q.state === 'wrong' && (
                  <span style={{ marginLeft:8, color:'#00D4AA', fontWeight:700 }}>
                    Correct answer: {q.question.correct_answer}
                  </span>
                )}
              </div>
              {q.question.explanation
                ? <div className="exp-text">{q.question.explanation}</div>
                : (
                  <div className="exp-text" style={{ fontStyle:'italic' }}>
                    {q.state === 'correct'
                      ? 'Well done! Keep it up.'
                      : `The correct answer is "${q.question.correct_answer}". Review this topic to strengthen your understanding.`
                    }
                  </div>
                )
              }
              {q.question.formula && <div className="exp-formula">{q.question.formula}</div>}
            </div>
          )}
        </div>

        {/* Nav */}
        <div className="exam-nav">
          <button className="enav-btn" onClick={() => setCurrent(c => Math.max(0,c-1))} disabled={current===0}>‹ Back</button>
          <button className="enav-btn danger" onClick={() => { const u=[...qs]; u[current]={...qs[current],selected:null,state:'unanswered'}; setQs(u); }}>Reset</button>
          {current < qs.length-1
            ? <button className="enav-btn primary" onClick={() => setCurrent(c => c+1)}>Next ›</button>
            : <button className="enav-btn primary" onClick={handleFinish} disabled={saving}>{saving?'Saving…':'Finish ✓'}</button>
          }
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
