'use client';
import NavBar from '@/components/NavBar';
import BottomNav from '@/components/BottomNav';

export default function CadetPage() {
  return (
    <div className="app-shell">
      <NavBar />
      <div style={{ paddingBottom: 100 }}>
        <div className="top-nav" style={{ justifyContent:'space-between' }}>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:16, fontWeight:700, color:'var(--white)' }}>Cadet Prep</div>
          <div style={{ fontSize:12, color:'var(--amber)' }}>My Progress →</div>
        </div>

        {/* Coming soon */}
        <div style={{ margin:'20px 20px 0', background:'rgba(245,166,35,0.08)', border:'1px solid rgba(245,166,35,0.25)', borderRadius:'var(--r-lg)', padding:'16px 20px', marginBottom:16 }}>
          <div className="coming-soon-badge" style={{ marginBottom:8 }}>🚧 Coming Soon</div>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:16, fontWeight:700, color:'var(--white)', marginBottom:6 }}>Cadet Prep — Coming Soon</div>
          <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.6 }}>Structured preparation for IndiGo, Air India, SpiceJet and more. Aptitude tests, psychometric practice, and interview coaching — launching soon.</div>
        </div>

        {/* Preview from design — faded */}
        <div style={{ background:'linear-gradient(135deg,#0D2444,#1B3A66)', border:'1px solid rgba(79,179,232,0.2)', borderRadius:'var(--r-lg)', padding:20, margin:'0 20px', position:'relative', overflow:'hidden', opacity:0.6 }}>
          <div style={{ position:'absolute', right:16, bottom:-8, fontSize:72, opacity:0.12 }}>🎯</div>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--amber)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>🎯 Airline Cadet Selection</div>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:18, fontWeight:700, color:'var(--white)', marginBottom:6 }}>Your Airline Journey Starts Here</div>
          <div style={{ fontSize:12, color:'var(--muted)', lineHeight:1.6, marginBottom:14 }}>Structured prep for IndiGo, Air India, SpiceJet & more — aptitude tests, psychometric practice, and interview coaching.</div>
          <button style={{ background:'var(--amber)', color:'var(--navy)', border:'none', borderRadius:8, padding:'10px 20px', fontSize:12, fontWeight:700, cursor:'not-allowed' }}>Begin Cadet Prep →</button>
        </div>

        <div style={{ padding:'16px 20px 8px', fontFamily:"'Space Grotesk',sans-serif", fontSize:14, fontWeight:600, color:'var(--white)' }}>Target Airlines</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, padding:'0 20px 20px', opacity:0.5 }}>
          {[['🔵','IndiGo','Cadet Pilot Program','Most popular'],['🔴','Air India','TATA Group Program',null],['🟠','SpiceJet','Cadet Program',null],['🟣','Akasa Air','New Entrant',null]].map(([emoji,name,count,badge])=>(
            <div key={name as string} style={{ background:'var(--navy-card)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:'14px 12px', textAlign:'center' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>{emoji}</div>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--white)', marginBottom:3 }}>{name}</div>
              <div style={{ fontSize:10, color:'var(--muted)' }}>{count}</div>
              {badge && <div style={{ display:'inline-block', background:'rgba(245,166,35,0.1)', border:'1px solid rgba(245,166,35,0.25)', borderRadius:10, padding:'2px 8px', fontSize:9, color:'var(--amber)', marginTop:6 }}>{badge}</div>}
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
