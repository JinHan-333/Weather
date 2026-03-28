import { useState, useEffect, useRef } from 'react';
import { WX_NAME, WX_COMMUTE_DESC, WX_STRESS_DESC, MOOD_DESC } from '../utils/constants';
import { getDominantWeather, getAverages } from '../utils/helpers';
import useScrollReveal from '../hooks/useScrollReveal';
import useCountUp from '../hooks/useCountUp';

function AnimatedStat({ value, label, descMap }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const animated = useCountUp(value, 900, visible);
  const desc = descMap ? descMap[Math.round(value)] || '' : '';

  return (
    <div className="stat-card" ref={ref}>
      <div className="stat-label">{label}</div>
      <div className="stat-big serif-italic">{animated.toFixed(1)}</div>
      {desc && <div className="stat-under">{desc}</div>}
    </div>
  );
}

export default function StatsSection({ data }) {
  const ref = useScrollReveal();
  if (!data.length) return null;

  const domWx = getDominantWeather(data);
  const avgs = getAverages(data);

  return (
    <section className="stats-section" id="stats">
      <h2 className="section-heading">At a Glance</h2>
      <p className="section-sub">Averages across {data.length} check-ins.</p>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Most Reported Weather</div>
          <div className="stat-big serif-italic">{WX_NAME[domWx] || domWx}</div>
          <div className="stat-under stat-weather-bar"></div>
        </div>
        <AnimatedStat value={avgs.commute} label="Avg Commute Difficulty" descMap={WX_COMMUTE_DESC} />
        <AnimatedStat value={avgs.stress} label="Avg Stress Level" descMap={WX_STRESS_DESC} />
        <AnimatedStat value={avgs.mood} label="Avg Mood" descMap={MOOD_DESC} />
      </div>
    </section>
  );
}
