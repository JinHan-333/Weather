import { useEffect, useRef } from 'react';
import { WX_NAME } from '../utils/constants';
import { getDominantWeather, getAverages } from '../utils/helpers';
import { createTodayAnimation } from '../utils/canvasRenderers';

export default function TodayPanel({ data }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  const n = data.length;
  const domWx = getDominantWeather(data);
  const avgs = getAverages(data);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;

    if (animRef.current) cancelAnimationFrame(animRef.current);

    const { draw } = createTodayAnimation(canvas, data);

    function animate() {
      draw();
      animRef.current = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [data]);

  return (
    <div className="today-panel">
      <div className="today-panel-header">
        <span className="today-tag">Live</span>
        <span className="today-title">Collective Preview</span>
      </div>
      <div className="today-canvas-wrap">
        <canvas ref={canvasRef}></canvas>
      </div>
      <div className="today-stats">
        <div className="today-stat">
          <div className="today-stat-label">Most Reported</div>
          <div className="today-stat-val">{n ? WX_NAME[domWx] : '—'}</div>
        </div>
        <div className="today-stat">
          <div className="today-stat-label">Avg Commute</div>
          <div className="today-stat-val">{n ? avgs.commute.toFixed(1) : '—'}</div>
        </div>
        <div className="today-stat">
          <div className="today-stat-label">Avg Stress</div>
          <div className="today-stat-val">{n ? avgs.stress.toFixed(1) : '—'}</div>
        </div>
        <div className="today-stat">
          <div className="today-stat-label">Avg Mood</div>
          <div className="today-stat-val">{n ? avgs.mood.toFixed(1) : '—'}</div>
        </div>
      </div>
      <div className="today-entries">{n} check-in{n !== 1 ? 's' : ''} recorded</div>
    </div>
  );
}
