import { useLayoutEffect, useRef, useState } from "react";

const same = (a, b) =>
  a &&
  b &&
  a.left == b.left &&
  a.width == b.width &&
  a.right == b.right &&
  a.top == b.top &&
  a.height == b.height;

export default function useSelectedRect(containerRef, selector, selected) {
  const [rect, setRect] = useState(null);
  const lastRef = useRef(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const el = container.querySelector(selector);
      const last = lastRef.current;
      if (!el) {
        lastRef.current = null;
        setRect(null);
        return;
      }
      const next = {
        left: el.offsetLeft,
        width: el.offsetWidth,
        right: container.clientWidth - el.offsetLeft - el.offsetWidth,
        top: el.offsetTop,
        height: el.offsetHeight,
      };
      if (same(next, last)) return;
      next.direction = last ? Math.sign(next.left - last.left) : 0;
      lastRef.current = next;
      setRect(next);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef, selector, selected]);

  return rect;
}
