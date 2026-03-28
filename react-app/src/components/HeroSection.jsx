import TodayPanel from './TodayPanel';

export default function HeroSection({ data }) {
  return (
    <section className="hero-section" id="hero">
      <div className="hero-left">
        <p className="eyebrow">A Collective Data Experiment</p>
        <h1 className="hero-title">Forecasting<br /><em>Feelings</em></h1>
        <p className="hero-desc">How does weather shape the way students feel? Submit your daily check-in and watch the collective mood take shape.</p>
        <p className="hero-support">Every entry becomes part of a living canvas.</p>
        <div className="hero-ctas">
          <a href="#check-in" className="btn-primary">Start Check-In</a>
          <a href="#archive" className="btn-ghost">View the Archive</a>
        </div>
      </div>
      <TodayPanel data={data} />
    </section>
  );
}
