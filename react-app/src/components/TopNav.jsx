import { useEffect, useState } from 'react';

export default function TopNav() {
  const [active, setActive] = useState('atmosphere');

  useEffect(() => {
    function onScroll() {
      const sections = ['hero', 'check-in', 'atmosphere', 'stats', 'archive', 'methodology'];
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

  const navClass = (id) => `topnav-link${active === id ? ' active' : ''}`;

  return (
    <nav className="topnav">
      <a className="topnav-logo" href="#hero">Forecasting Feelings</a>
      <div className="topnav-links">
        <a href="#check-in" className={navClass('check-in')}>Check-In</a>
        <a href="#atmosphere" className={navClass('atmosphere')}>Canvas</a>
        <a href="#stats" className={navClass('stats')}>Snapshot</a>
        <a href="#archive" className={navClass('archive')}>Archive</a>
        <a href="#methodology" className={navClass('methodology')}>Method</a>
      </div>
    </nav>
  );
}
