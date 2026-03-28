import { useEffect, useRef, useState, useCallback } from 'react';
import { drawLineChart } from '../utils/canvasRenderers';
import useScrollReveal from '../hooks/useScrollReveal';

const WX_LABELS = { sunny: 'Sunny', cloudy: 'Cloudy', rainy: 'Rainy', snowy: 'Snowy', windy: 'Windy' };
const FIELD_LABELS = { stress: 'Avg Stress', commute: 'Avg Commute Difficulty' };

function ChartCard({ title, data, field, icons }) {
  const canvasRef = useRef(null);
  const pointsRef = useRef([]);
  const [hover, setHover] = useState(null); // { x, y, wx, avg, count, index }

  const renderChart = useCallback((highlightIdx) => {
    if (!canvasRef.current) return;
    const pts = drawLineChart(canvasRef.current, data, field, highlightIdx);
    if (pts) pointsRef.current = pts;
  }, [data, field]);

  useEffect(() => {
    renderChart(hover?.index ?? -1);
    function onResize() { renderChart(hover?.index ?? -1); }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [data, renderChart, hover]);

  function handleMouseMove(e) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const scaleX = canvas.clientWidth / (canvas.width / (window.devicePixelRatio || 1));
    const scaleY = canvas.clientHeight / (canvas.height / (window.devicePixelRatio || 1));

    let closest = null;
    let minDist = 20; // hit radius in px
    pointsRef.current.forEach(pt => {
      const dx = mx - pt.x * scaleX;
      const dy = my - pt.y * scaleY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) { minDist = dist; closest = pt; }
    });

    setHover(closest);
  }

  function handleMouseLeave() {
    setHover(null);
  }

  return (
    <div className="chart-card">
      <div className="chart-title">{title}</div>
      <div className="chart-canvas-wrap">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: hover ? 'pointer' : 'default' }}
        />
        {hover && (
          <div
            className="chart-tooltip"
            style={{
              left: hover.x,
              top: hover.y - 72,
            }}
          >
            <div className="chart-tooltip-title">{WX_LABELS[hover.wx] || hover.wx}</div>
            <div className="chart-tooltip-metric">{FIELD_LABELS[field]}</div>
            <div className="chart-tooltip-value">{hover.avg.toFixed(1)}</div>
            <div className="chart-tooltip-count">{hover.count} check-in{hover.count !== 1 ? 's' : ''}</div>
          </div>
        )}
      </div>
      {icons}
    </div>
  );
}

export default function ChartsSection({ data }) {
  const ref = useScrollReveal();
  return (
    <section ref={ref} className="charts-section reveal" id="archive">
      <h2 className="section-heading">The Archive</h2>
      <p className="section-sub">Weather vs. stress and commute, across all entries.</p>
      <div className="charts-grid">
        <ChartCard
          title="Weather vs Average Stress"
          data={data}
          field="stress"
          icons={
            <div className="chart-wx-icons">
              <span title="Sunny"><img src="/icons/sunny.png" alt="Sunny" className="wx-icon-img" /></span>
              <span title="Cloudy"><img src="/icons/cloudy.png" alt="Cloudy" className="wx-icon-img" /></span>
              <span title="Rainy"><img src="/icons/rainy.png" alt="Rainy" className="wx-icon-img" /></span>
              <span title="Snowy"><img src="/icons/snowy.png" alt="Snowy" className="wx-icon-img" /></span>
              <span title="Windy"><img src="/icons/windy.png" alt="Windy" className="wx-icon-img" /></span>
            </div>
          }
        />
        <ChartCard
          title="Weather vs Commute Difficulty"
          data={data}
          field="commute"
          icons={
            <div className="chart-wx-labels">
              <span>Sunny</span><span>Cloudy</span><span>Rainy</span><span>Snowy</span><span>Windy</span>
            </div>
          }
        />
      </div>
    </section>
  );
}
