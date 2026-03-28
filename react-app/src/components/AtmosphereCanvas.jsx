import { useEffect, useRef, useCallback, useState } from 'react';
import { createAtmosphereAnimation, WX_COLORS } from '../utils/canvasRenderers';

const WX_LABELS = { sunny: 'Sunny', cloudy: 'Cloudy', rainy: 'Rainy', snowy: 'Snowy', windy: 'Windy' };

const LEGEND = [
  { key: 'sunny',  label: 'Sunny',  iconSrc: '/icons/sunny.png' },
  { key: 'cloudy', label: 'Cloudy', iconSrc: '/icons/cloudy.png' },
  { key: 'rainy',  label: 'Rainy',  iconSrc: '/icons/rainy.png' },
  { key: 'snowy',  label: 'Snowy',  iconSrc: '/icons/snowy.png' },
  { key: 'windy',  label: 'Windy',  iconSrc: '/icons/windy.png' },
];

export default function AtmosphereCanvas({ data }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const mouseRef = useRef({ x: -1, y: -1 });
  const hoveredEntryRef = useRef(null);
  const hitTestRef = useRef(null);
  const setFilterRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [weatherFilter, setWeatherFilter] = useState(null);

  const toggleFilter = (key) => {
    setWeatherFilter(prev => prev === key ? null : key);
  };

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    mouseRef.current = { x: mx, y: my };

    if (hitTestRef.current) {
      const hit = hitTestRef.current(mx, my);
      if (hit) {
        const canvasW = canvas.clientWidth;
        const canvasH = canvas.clientHeight;
        const dotX = hit.x;
        const dotY = hit.y;
        const tipW = 130;
        const tipH = 90;
        const gap = 14;

        // Decide placement: prefer above, fall back to below/left/right
        let tx = dotX;
        let ty = dotY - tipH - gap;
        let anchor = 'above';

        // If above would clip top, go below
        if (ty < 8) {
          ty = dotY + gap;
          anchor = 'below';
        }
        // If right side clips, shift left
        if (tx + tipW / 2 > canvasW - 8) {
          tx = canvasW - tipW / 2 - 8;
        }
        // If left side clips, shift right
        if (tx - tipW / 2 < 8) {
          tx = tipW / 2 + 8;
        }

        hoveredEntryRef.current = hit.entry;
        setTooltip({ x: tx, y: ty, entry: hit.entry, anchor });
      } else {
        hoveredEntryRef.current = null;
        setTooltip(null);
      }
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: -1, y: -1 };
    hoveredEntryRef.current = null;
    setTooltip(null);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;

    if (animRef.current) cancelAnimationFrame(animRef.current);

    const { draw, hitTest, setFilter } = createAtmosphereAnimation(canvas, data, mouseRef, hoveredEntryRef);
    hitTestRef.current = hitTest;
    setFilterRef.current = setFilter;

    function animate() {
      draw();
      animRef.current = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [data]);

  useEffect(() => {
    if (setFilterRef.current) setFilterRef.current(weatherFilter);
  }, [weatherFilter]);

  const e = tooltip?.entry;

  return (
    <section className="atmosphere-section" id="atmosphere">
      <h2 className="section-heading">The Living Canvas</h2>
      <p className="section-sub">Color reflects weather. Density reflects stress. Light reflects mood.</p>

      <div className="canvas-wrap">
        <div className="canvas-container" id="canvas-container">
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: tooltip ? 'pointer' : 'default' }}
          ></canvas>
          {tooltip && e && (
            <div
              className={`canvas-tooltip canvas-tooltip-${tooltip.anchor}`}
              style={{
                left: tooltip.x,
                top: tooltip.y,
              }}
            >
              <div className="canvas-tooltip-title">
                <span className="canvas-tooltip-color" style={{ background: `rgb(${WX_COLORS[e.weather]?.r},${WX_COLORS[e.weather]?.g},${WX_COLORS[e.weather]?.b})` }} />
                {WX_LABELS[e.weather] || e.weather}
              </div>
              <div className="canvas-tooltip-grid">
                <span className="canvas-tooltip-label">Commute</span>
                <span className="canvas-tooltip-val">{e.commute}/5</span>
                <span className="canvas-tooltip-label">Stress</span>
                <span className="canvas-tooltip-val">{e.stress}/5</span>
                <span className="canvas-tooltip-label">Mood</span>
                <span className="canvas-tooltip-val">{e.mood}/5</span>
                <span className="canvas-tooltip-label">Effort</span>
                <span className="canvas-tooltip-val">{e.effort === 1 ? 'None' : e.effort === 2 ? 'A Little' : 'A Lot'}</span>
              </div>
            </div>
          )}
        </div>
        <div className="canvas-legend">
          <div className="canvas-legend-group">
            <div className="canvas-legend-heading">Color = Weather</div>
            {LEGEND.map(item => {
              const c = WX_COLORS[item.key];
              const isActive = weatherFilter === item.key;
              const isDimmed = weatherFilter && !isActive;
              return (
                <div
                  key={item.key}
                  className={`canvas-legend-item canvas-legend-item-clickable${isActive ? ' active' : ''}${isDimmed ? ' dimmed' : ''}`}
                  onClick={() => toggleFilter(item.key)}
                >
                  <span
                    className="canvas-legend-dot"
                    style={{ background: `rgb(${c.r},${c.g},${c.b})` }}
                  >
                    {item.iconSrc && <img src={item.iconSrc} alt={item.label} className="wx-icon-img legend-icon-tinted" />}
                  </span>
                  <span className="canvas-legend-label">{item.label}</span>
                </div>
              );
            })}
          </div>
          <div className="canvas-legend-divider" />
          <div className="canvas-legend-group">
            <div className="canvas-legend-heading">Size = Commute</div>
            <div className="canvas-legend-sizes">
              <span className="canvas-legend-size-dot" style={{ width: 5, height: 5 }} />
              <span className="canvas-legend-size-dot" style={{ width: 8, height: 8 }} />
              <span className="canvas-legend-size-dot" style={{ width: 11, height: 11 }} />
              <span className="canvas-legend-range">Easy &rarr; Hard</span>
            </div>
          </div>
          <div className="canvas-legend-divider" />
          <div className="canvas-legend-group">
            <div className="canvas-legend-heading">Brightness = Mood</div>
            <div className="canvas-legend-range">Low &rarr; High</div>
          </div>
        </div>
      </div>
    </section>
  );
}
