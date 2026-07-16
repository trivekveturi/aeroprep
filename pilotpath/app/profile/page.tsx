'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import NavBar from '@/components/NavBar';
import BottomNav from '@/components/BottomNav';
import type { UserProgress } from '@/lib/types';

const GOAL_LABELS: Record<string, string> = {
  'pass-dgca':     'Pass DGCA Written Exams',
  'airline-cadet': 'Get Airline Cadet Selected',
  'classes':       'Learn & Attend Classes',
  'explore':       'Explore Aviation Career',
};

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch('/api/progress').then(r=>r.json()).then(setProgress).catch(()=>{});
  }, [user]);

  if (!user) return null;

  const initials = user.displayName.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);

  return (
    <div className="app-shell">
      <NavBar />
      <div style={{ paddingBottom: 100 }}>
        {/* Avatar hero */}
        <div style={{ background:'linear-gradient(180deg,var(--navy-mid) 0%,var(--navy) 100%)', padding:'32px 20px 24px', textAlign:'center' }}>
          <div style={{ width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,var(--blue),var(--green))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:700, margin:'0 auto 12px' }}>
            {initials}
          </div>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:20, fontWeight:700, color:'var(--white)', marginBottom:4 }}>{user.displayName}</div>
          <div style={{ fontSize:12, color:'var(--muted)' }}>@{user.username}</div>
          {progress?.goal && (
            <div style={{ display:'inline-flex', marginTop:10, background:'rgba(79,179,232,0.08)', border:'1px solid rgba(79,179,232,0.2)', borderRadius:20, padding:'4px 14px', fontSize:11, color:'var(--sky)', fontWeight:600 }}>
              {GOAL_LABELS[progress.goal] ?? progress.goal}
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, padding:'16px 20px' }}>
          {[
            { label:'Questions Done', value: progress?.questionsAttempted ?? 0 },
            { label:'Study Streak',   value: `${progress?.streak ?? 0} days` },
            { label:'Attempts',       value: progress?.attempts.length ?? 0 },
            { label:'Flagged Qs',     value: progress?.flaggedQuestions.length ?? 0 },
          ].map(s => (
            <div key={s.label} style={{ background:'var(--navy-card)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:'14px 16px' }}>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:24, fontWeight:700, color:'var(--white)' }}>{s.value}</div>
              <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ padding:'0 20px', display:'flex', flexDirection:'column', gap:10 }}>
          <button
            onClick={logout}
            style={{ width:'100%', height:46, borderRadius:10, background:'transparent', border:'1px solid rgba(255,77,106,0.3)', color:'#FF4D6A', fontSize:13, fontWeight:600, cursor:'pointer' }}
          >
            Sign Out
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
