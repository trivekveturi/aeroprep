'use client';
import NavBar from '@/components/NavBar';
import BottomNav from '@/components/BottomNav';

export default function SubscriptionPage() {
  return (
    <div className="app-shell">
      <NavBar />
      <div style={{ paddingBottom: 100 }}>
        <div style={{ padding:'52px 22px 20px', textAlign:'center' }}>
          <div className="coming-soon-badge" style={{ margin:'0 auto 16px' }}>🚧 Coming Soon</div>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:22, fontWeight:700, color:'var(--white)', marginBottom:6 }}>Choose Your Plan</div>
          <div style={{ fontSize:13, color:'var(--muted)', marginBottom:24 }}>Unlock your full potential. Cancel anytime.</div>
        </div>

        {/* Plans from design — preview */}
        <div style={{ margin:'0 20px 12px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'14px 16px', opacity:0.7 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--muted)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4 }}>FREE</div>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:24, fontWeight:700, color:'var(--white)', marginBottom:12 }}>₹0 <span style={{ fontSize:13, color:'var(--muted)', fontWeight:400 }}>/month</span></div>
          {['50 questions per day','2 mock tests per month','Community forum access'].map(f=>(
            <div key={f} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <span style={{ color:'var(--green)' }}>✓</span>
              <span style={{ fontSize:12, color:'var(--muted)' }}>{f}</span>
            </div>
          ))}
          <button style={{ width:'100%', height:44, borderRadius:'var(--r-sm)', background:'transparent', border:'1px solid var(--border)', color:'var(--white)', fontSize:13, fontWeight:700, cursor:'not-allowed', marginTop:16 }}>Current Plan</button>
        </div>

        <div style={{ margin:'0 20px 12px', background:'linear-gradient(135deg,rgba(27,108,168,0.14),rgba(27,108,168,0.05))', border:'1px solid #1B6CA8', borderRadius:14, padding:'14px 16px', position:'relative', opacity:0.7 }}>
          <div style={{ position:'absolute', top:12, right:-4, background:'#1B6CA8', color:'var(--white)', fontSize:9, fontWeight:800, letterSpacing:'0.08em', padding:'4px 12px 4px 8px', borderRadius:'4px 0 0 4px' }}>POPULAR</div>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--sky)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4 }}>PRO</div>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:24, fontWeight:700, color:'var(--white)', marginBottom:12 }}>₹499 <span style={{ fontSize:13, color:'var(--muted)', fontWeight:400 }}>/month</span></div>
          {['Unlimited questions & mocks','Full analytics dashboard','All recorded courses','Cadet prep module','2 live classes/month'].map(f=>(
            <div key={f} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <span style={{ color:'var(--green)' }}>✓</span>
              <span style={{ fontSize:12, color:'var(--white)' }}>{f}</span>
            </div>
          ))}
          <button style={{ width:'100%', height:44, borderRadius:'var(--r-sm)', background:'var(--blue)', border:'none', color:'var(--white)', fontSize:13, fontWeight:700, cursor:'not-allowed', marginTop:16 }}>Upgrade to Pro</button>
        </div>

        <div style={{ margin:'0 20px 20px', background:'linear-gradient(135deg,rgba(245,166,35,0.1),rgba(245,166,35,0.03))', border:'1px solid rgba(245,166,35,0.3)', borderRadius:14, padding:'14px 16px', opacity:0.7 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--amber)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4 }}>PRO+</div>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:24, fontWeight:700, color:'var(--white)', marginBottom:12 }}>₹999 <span style={{ fontSize:13, color:'var(--muted)', fontWeight:400 }}>/month</span></div>
          {['Everything in Pro','Unlimited live classes','1 mentorship session/month','AI study plan + offline access'].map(f=>(
            <div key={f} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <span style={{ color:'var(--amber)' }}>✓</span>
              <span style={{ fontSize:12, color:'var(--muted)' }}>{f}</span>
            </div>
          ))}
          <button style={{ width:'100%', height:44, borderRadius:'var(--r-sm)', border:'1px solid rgba(245,166,35,0.4)', background:'transparent', color:'var(--amber)', fontSize:13, fontWeight:700, cursor:'not-allowed', marginTop:14 }}>Upgrade to Pro+</button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
