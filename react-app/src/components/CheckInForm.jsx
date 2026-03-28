import { useState } from 'react';
import { uid } from '../utils/helpers';

const WEATHER_OPTIONS = [
  { value: 'sunny',  icon: null, iconSrc: '/icons/sunny.png', label: 'Sunny' },
  { value: 'cloudy', icon: null, iconSrc: '/icons/cloudy.png', label: 'Cloudy' },
  { value: 'rainy',  icon: null, iconSrc: '/icons/rainy.png', label: 'Rainy' },
  { value: 'snowy',  icon: null, iconSrc: '/icons/snowy.png', label: 'Snowy' },
  { value: 'windy',  icon: null, iconSrc: '/icons/windy.png', label: 'Windy' },
];

const EFFORT_OPTIONS = [
  { value: 1, label: 'None' },
  { value: 2, label: 'A Little' },
  { value: 3, label: 'A Lot' },
];

export default function CheckInForm({ onSubmit }) {
  const [weather, setWeather] = useState(null);
  const [commute, setCommute] = useState(3);
  const [stress, setStress] = useState(3);
  const [mood, setMood] = useState(3);
  const [effort, setEffort] = useState(null);
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    const newErrors = {};
    if (!weather) newErrors.weather = true;
    if (effort === null) newErrors.effort = true;
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    const entry = {
      id: uid(),
      timestamp: new Date().toISOString(),
      weather,
      commute,
      stress,
      mood,
      effort,
    };

    onSubmit(entry);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3500);

    // Reset
    setWeather(null);
    setCommute(3);
    setStress(3);
    setMood(3);
    setEffort(null);
    setErrors({});
  }

  return (
    <section className="checkin-section" id="check-in">
      <div className="checkin-left">
        <h2 className="section-heading serif-italic">Log Your Morning</h2>
        <p className="checkin-desc">Record today's weather, commute, and mood. Your entry shapes the collective canvas and contributes to the archive.</p>
      </div>

      <form className="checkin-form" noValidate onSubmit={handleSubmit}>
        {/* Weather */}
        <div className={`form-group${errors.weather ? ' has-error' : ''}`}>
          <label className="form-label-sm">Today's Weather</label>
          <div className="wx-grid">
            {WEATHER_OPTIONS.map(wx => (
              <button
                key={wx.value}
                type="button"
                className="wx-pill"
                aria-pressed={weather === wx.value ? 'true' : 'false'}
                onClick={() => { setWeather(wx.value); setErrors(e => ({ ...e, weather: false })); }}
              >
                <span className="wx-icon">{wx.iconSrc ? <img src={wx.iconSrc} alt={wx.label} className="wx-icon-img" /> : wx.icon}</span>
                <span className="wx-text">{wx.label}</span>
              </button>
            ))}
          </div>
          <p className="field-error">Please select a weather type.</p>
        </div>

        {/* Sliders row */}
        <div className="sliders-row">
          <div className="form-group flex1">
            <label className="form-label-sm" htmlFor="commute-slider">Commute Difficulty <span className="slider-val">{commute}</span></label>
            <input type="range" id="commute-slider" min="1" max="5" value={commute} onChange={e => setCommute(+e.target.value)} className="light-slider" />
            <div className="slider-ticks"><span>Easy</span><span>Hard</span></div>
          </div>
          <div className="form-group flex1">
            <label className="form-label-sm" htmlFor="stress-slider">Stress Level <span className="slider-val">{stress}</span></label>
            <input type="range" id="stress-slider" min="1" max="5" value={stress} onChange={e => setStress(+e.target.value)} className="light-slider" />
            <div className="slider-ticks"><span>Calm</span><span>Stressed</span></div>
          </div>
        </div>

        {/* Mood slider */}
        <div className="form-group">
          <label className="form-label-sm" htmlFor="mood-slider">Mood <span className="slider-val">{mood}</span></label>
          <input type="range" id="mood-slider" min="1" max="5" value={mood} onChange={e => setMood(+e.target.value)} className="light-slider" />
          <div className="slider-ticks"><span>Negative</span><span>Positive</span></div>
        </div>

        {/* Effort radio */}
        <div className={`form-group${errors.effort ? ' has-error' : ''}`}>
          <label className="form-label-sm">How much did weather affect your commute?</label>
          <div className="effort-row">
            {EFFORT_OPTIONS.map(opt => (
              <label key={opt.value} className="effort-opt">
                <input
                  type="radio"
                  name="effort"
                  value={opt.value}
                  checked={effort === opt.value}
                  onChange={() => { setEffort(opt.value); setErrors(e => ({ ...e, effort: false })); }}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
          <p className="field-error">Please select an option.</p>
        </div>

        <button type="submit" className="add-canvas-btn">Submit</button>
        {showSuccess && (
          <div className="success-msg visible" aria-live="polite">
            Check-in recorded. The canvas has been updated.
          </div>
        )}
      </form>
    </section>
  );
}
