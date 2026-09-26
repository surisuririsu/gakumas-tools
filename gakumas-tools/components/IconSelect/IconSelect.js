import { memo, useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "@/components/Image";
import c from "@/utils/classNames";
import useSelectedRect from "@/utils/useSelectedRect";
import styles from "./IconSelect.module.scss";

const ALL_OPTION = {
  id: null,
  iconSrc: "/all.png",
  alt: "All",
};

const SELECTED = `.${styles.selected}`;
const SLIDE = "420ms cubic-bezier(0.32, 1.34, 0.52, 1)";
const RESIZE = { duration: 340, easing: "cubic-bezier(0.22, 1, 0.36, 1)" };

function useResizeTransition(trackRef, innerRef) {
  const fromRef = useRef(null);

  useLayoutEffect(() => {
    const from = fromRef.current;
    const track = trackRef.current;
    const inner = innerRef.current;
    fromRef.current = null;
    if (!from || !track || !inner) return;
    const to = { width: track.offsetWidth, height: track.offsetHeight };
    if (from.width == to.width && from.height == to.height) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    inner.style.width = `${inner.offsetWidth}px`;
    const animation = track.animate(
      [
        { width: `${from.width}px`, height: `${from.height}px` },
        { width: `${to.width}px`, height: `${to.height}px` },
      ],
      RESIZE
    );
    const release = () => (inner.style.width = "");
    animation.onfinish = release;
    animation.oncancel = release;
  });

  return () => {
    const track = trackRef.current;
    fromRef.current = track && {
      width: track.offsetWidth,
      height: track.offsetHeight,
    };
  };
}

function IconSelect({ options, selected, onChange, collapsable, includeAll }) {
  const [expanded, setExpanded] = useState(false);
  const trackRef = useRef(null);
  const innerRef = useRef(null);
  const captureSize = useResizeTransition(trackRef, innerRef);
  const current = includeAll && !selected ? null : selected;
  const displayedOptions = useMemo(
    () => (includeAll ? [ALL_OPTION, ...options] : options),
    [includeAll, options]
  );

  const rect = useSelectedRect(trackRef, SELECTED, current);
  const [thumb, setThumb] = useState({ rect: null, current, slide: false });
  if (rect !== thumb.rect) {
    setThumb({
      rect,
      current,
      slide: !!thumb.rect && thumb.current != current,
    });
  }

  function toggle() {
    captureSize();
    setExpanded(!expanded);
  }

  return (
    <div
      ref={trackRef}
      className={c(
        styles.iconSelect,
        collapsable && styles.collapsable,
        collapsable && (expanded ? styles.expanded : styles.collapsed)
      )}
    >
      <div ref={innerRef} className={styles.options}>
        {thumb.rect && (
          <span
            className={styles.thumb}
            style={{
              left: thumb.rect.left,
              top: thumb.rect.top,
              width: thumb.rect.width,
              height: thumb.rect.height,
              transition: thumb.slide ? `left ${SLIDE}, top ${SLIDE}` : "none",
            }}
            aria-hidden="true"
          />
        )}
        {displayedOptions.map(({ id, iconSrc, alt }, i) => (
          <button
            key={id}
            type="button"
            className={c(styles.option, current == id && styles.selected)}
            style={{ "--i": i }}
            aria-pressed={current == id}
            onClick={() => {
              onChange(id);
              if (collapsable) toggle();
            }}
          >
            <Image
              src={iconSrc}
              alt={alt}
              width={24}
              height={24}
              draggable={false}
            />
          </button>
        ))}
        {collapsable && (
          <span className={styles.caret} onClick={toggle} aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

export default memo(IconSelect);
