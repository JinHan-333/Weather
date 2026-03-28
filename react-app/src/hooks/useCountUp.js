import { useState, useEffect, useRef } from 'react';

export default function useCountUp(target, duration = 800, trigger = true) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (!trigger || target === 0) return;

    const from = prevTarget.current;
    prevTarget.current = target;

    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + (target - from) * eased);
      if (t < 1) requestAnimationFrame(step);
      else setValue(target);
    }
    requestAnimationFrame(step);
  }, [target, duration, trigger]);

  return value;
}
