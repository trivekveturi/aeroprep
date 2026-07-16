'use client';
import NavBar from '@/components/NavBar';
import BottomNav from '@/components/BottomNav';

export default function ClassesPage() {
  return (
    <div className="app-shell">
      <NavBar />
      <div style={{ paddingBottom: 100 }}>
        {/* Real-looking UI from design — marked coming soon */}
        <div className="top-nav" style={{ justifyContent:'space-between' }}>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:16, fontWeight:700, color:'var(--white)' }}>Classes</div>
          <div style={{ fontSize:12, color:'var(--sky)' }}>My Enrolled →</div>
        </div>

        {/* Coming soon banner */}
        <div style={{ margin:'20px 20px 0', background:'rgba(245,166,35,0.08)', border:'1px solid rgba(245,166,35,0.25)', borderRadius:'var(--r-lg)', padding:'16px 20px' }}>
          <div className="coming-soon-badge" style={{ marginBottom:8 }}>🚧 Coming Soon</div>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:16, fontWeight:700, color:'var(--white)', marginBottom:6 }}>Live Classes Coming Soon</div>
          <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.6 }}>We&apos;re bringing expert DGCA instructors live to your screen. Check back soon for live sessions, recorded lectures, and career guidance webinars.</div>
        </div>

        {/* Preview cards from design */}
        <div style={{ margin:'20px 20px 0', background:'var(--navy-card)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:'16px 18px', position:'relative', overflow:'hidden', opacity:0.5 }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,#FF4D6A,#F5A623)' }} />
          <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(255,77,106,0.1)', border:'1px solid rgba(255,77,106,0.3)', borderRadius:20, padding:'3px 10px', fontSize:10, fontWeight:700, color:'#FF4D6A', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>
            <div className="live-dot" /> LIVE NOW
          </div>
          <div style={{ fontSize:14, fontWeight:600, color:'var(--white)', marginBottom:6 }}>Air Regulations — ATC Phraseology Deep Dive</div>
          <div style={{ fontSize:12, color:'var(--muted)', marginBottom:12 }}>Capt. Rahul Mehta · DGCA Examiner</div>
          <div style={{ display:'flex', gap:16, marginBottom:14 }}>
            <div style={{ fontSize:11, color:'var(--muted)' }}>👥 247 watching</div>
            <div style={{ fontSize:11, color:'var(--muted)' }}>⏱ 38 min remaining</div>
          </div>
          <button style={{ width:'100%', padding:11, borderRadius:'var(--r-sm)', border:'none', background:'#FF4D6A', color:'var(--white)', fontSize:13, fontWeight:700, cursor:'not-allowed' }}>Join Live Class →</button>
        </div>

        <div style={{ margin:'12px 20px', background:'var(--navy-card)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:'16px 18px', opacity:0.4 }}>
          <div style={{ fontSize:14, fontWeight:600, color:'var(--white)', marginBottom:6 }}>Meteorology — Weather Hazards & Avoidance</div>
          <div style={{ fontSize:12, color:'var(--muted)', marginBottom:12 }}>Ms. Priya Sharma · Senior Met Instructor</div>
          <div style={{ display:'flex', gap:16, marginBottom:14 }}>
            <div style={{ fontSize:11, color:'var(--muted)' }}>📅 Tomorrow, 6:00 PM</div>
            <div style={{ fontSize:11, color:'var(--muted)' }}>⏱ 90 min</div>
          </div>
          <button style={{ width:'100%', padding:11, borderRadius:'var(--r-sm)', border:'none', background:'var(--blue)', color:'var(--white)', fontSize:13, fontWeight:700, cursor:'not-allowed' }}>Enrol</button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
