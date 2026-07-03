import { useEffect, useRef, useState } from 'react';

/** Animates a number from its previous value to the target over `duration` ms. */
export function useCountUp(target: number, duration = 600): number {
  const [value, setValue] = useState(target);
  const previous = useRef(target);
  const frame = useRef<number>(0);

  useEffect(() => {
    const from = previous.current;
    previous.current = target;
    if (from === target) return;

    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(from + (target - from) * eased);
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick);
      }
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration]);

  return value;
}
