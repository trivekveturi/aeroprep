'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

function initials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

interface NavBarProps {
  streak?: number;
}

export default function NavBar({ streak = 0 }: NavBarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/practice',  label: 'Practice' },
    { href: '/mock',      label: 'Mock Tests' },
    { href: '/classes',   label: 'Classes' },
    { href: '/cadet',     label: 'Cadet Prep' },
  ];

  return (
    <>
      {/* ── Top bar — shown on ALL screen sizes ── */}
      <nav className="top-nav">
        <div className="nav-logo">
          <div className="nav-logo-icon">✈</div>
          <span className="nav-logo-text">PilotPath</span>
        </div>

        {/* Web nav links — hidden on mobile via CSS */}
        <div className="web-nav-links">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`web-nav-item ${pathname.startsWith(item.href) ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="nav-right">
          {streak > 0 && (
            <div className="streak-badge">🔥 {streak}</div>
          )}
          {user && (
            <>
              <Link href="/profile">
                <div className="nav-avatar" title={user.displayName}>
                  {initials(user.displayName)}
                </div>
              </Link>
              {/* Logout button — web only */}
              <button
                onClick={logout}
                className="nav-logout-btn"
                aria-label="Logout"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </nav>
    </>
  );
}
