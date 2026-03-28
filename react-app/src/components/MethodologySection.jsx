import useScrollReveal from '../hooks/useScrollReveal';

export default function MethodologySection() {
  const sectionRef = useScrollReveal();

  return (
    <section ref={sectionRef} className="methodology-section reveal" id="methodology">
      <div className="method-card">
        <h2 className="method-title serif-italic">How it works</h2>
        <p>Each check-in becomes a dot in the circular field. Weather determines color. Stress controls density - high-stress areas cluster tightly. Mood sets brightness - higher moods glow, lower moods dim.</p>
        <p>The canvas rotates slowly and breathes with the data. As more entries accumulate, patterns emerge - a living portrait of how weather shapes the student experience.</p>
      </div>
      <div className="method-img">
        <img src="/weather-icons.png" alt="Weather icon illustrations" />
      </div>
    </section>
  );
}
