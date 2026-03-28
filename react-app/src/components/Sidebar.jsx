import { useEffect, useState } from 'react';

const NAV_ITEMS = [
  { id: 'atmosphere', href: '#atmosphere', label: 'Atmosphere', icon: <path d="M3 9l2 2m0 0l7-7 7 7M5 11v9a1 1 0 001 1h3m10-10l2-2m-2 2v9a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/> },
  { id: 'check-in', href: '#check-in', label: 'Check-In', icon: <><path d="M12 3v1m0 16v1M4.22 4.22l.7.7m12.02 12.02l.7.7M3 12h1m16 0h1M4.92 19.08l.7-.7M18.36 5.64l.7-.7"/><circle cx="12" cy="12" r="4"/></> },
  { id: 'archive', href: '#archive', label: 'Archive', icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/> },
  { id: 'methodology', href: '#methodology', label: 'Method', icon: <><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></> },
  { id: 'about', href: '#about', label: 'About', icon: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></> },
];

export default function Sidebar() {
  const [active, setActive] = useState('atmosphere');

  useEffect(() => {
    function onScroll() {
      const sections = ['hero', 'atmosphere', 'check-in', 'methodology'];
      let current = 'atmosphere';
      sections.forEach(id => {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 100) current = id;
      });
      setActive(current);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-title">Forecasting Feelings</div>
        <div className="brand-divider"></div>
        <div className="brand-sub-group">
          <div className="brand-sub-title">The Shared Forecast</div>
          <div className="brand-sub">Weather, Commute, and Mood Archive</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <a key={item.id} href={item.href} className={`snav-item${active === item.id ? ' active' : ''}`}>
            <svg className="snav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              {item.icon}
            </svg>
            {item.label}
          </a>
        ))}
      </nav>

      <a href="#check-in" className="sidebar-cta">Start Check-In</a>
    </aside>
  );
}
