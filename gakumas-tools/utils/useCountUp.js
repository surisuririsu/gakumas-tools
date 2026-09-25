import { useEffect, useRef, useState } from "react";

export default function useCountUp(target, duration = 850) {
  const [value, setValue] = useState(target);
  const currentRef = useRef(target);

  useEffect(() => {
    const from = currentRef.current;
    if (from === target) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      currentRef.current = target;
      setValue(target);
      return;
    }

    const start = performance.now();
    let frame;
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      currentRef.current = Math.round(from + (target - from) * eased);
      setValue(currentRef.current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}
