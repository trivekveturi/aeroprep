'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/dashboard', icon: '🏠', label: 'Home' },
  { href: '/practice',  icon: '📝', label: 'Practice' },
  { href: '/classes',   icon: '🎓', label: 'Classes' },
  { href: '/progress',  icon: '📊', label: 'Progress' },
  { href: '/profile',   icon: '👤', label: 'Profile' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    // bottom-nav CSS handles display:flex, flex-direction:row, position:fixed
    // It is hidden on ≥768px via the @media rule in globals.css
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      {items.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={`bnav-item ${pathname.startsWith(item.href) ? 'active' : ''}`}
          aria-label={item.label}
          aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
        >
          <span className="bnav-icon" aria-hidden="true">{item.icon}</span>
          <span className="bnav-label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
