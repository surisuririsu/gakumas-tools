import { useLayoutEffect, useState } from "react";

export default function useSelectedRect(containerRef, selector, selected) {
  const [rect, setRect] = useState(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const el = container.querySelector(selector);
      setRect(
        el && {
          left: el.offsetLeft,
          top: el.offsetTop,
          width: el.offsetWidth,
          height: el.offsetHeight,
        }
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef, selector, selected]);

  return rect;
}
