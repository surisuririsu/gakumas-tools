import { memo, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import styles from "./SimulationRuns.module.scss";

function MiniBoxPlot({ stats, xMin, xMax, highlight, ticks }) {
  const t = useTranslations("BoxPlot");
  const [tipOpen, setTipOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!tipOpen) return;
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setTipOpen(false);
      }
    }
    document.addEventListener("pointerdown", handle);
    return () => document.removeEventListener("pointerdown", handle);
  }, [tipOpen]);

  if (!stats || xMax <= xMin) {
    return <div className={styles.emptyPlot} />;
  }

  const span = xMax - xMin;
  const pct = (v) => ((v - xMin) / span) * 100;

  const minX = pct(stats.min);
  const q1X = pct(stats.q1);
  const medX = pct(stats.median);
  const meanX = pct(stats.mean);
  const q3X = pct(stats.q3);
  const maxX = pct(stats.max);

  const fmt = (v) => Math.round(v).toLocaleString();

  return (
    <div
      ref={ref}
      className={`${styles.boxPlotWrap} ${highlight ? styles.boxPlotCurrent : ""}`}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") setTipOpen(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") setTipOpen(false);
      }}
      onClick={() => setTipOpen((v) => !v)}
    >
      <svg
        className={styles.boxPlot}
        viewBox="0 0 100 10"
        preserveAspectRatio="none"
        aria-hidden
      >
        {ticks?.map((tick, i) => {
          const x = pct(tick);
          if (x < 0 || x > 100) return null;
          return (
            <line
              key={i}
              className={styles.gridLine}
              x1={x}
              y1={0}
              x2={x}
              y2={10}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        <line
          className={styles.whisker}
          x1={minX}
          y1={5}
          x2={maxX}
          y2={5}
          vectorEffect="non-scaling-stroke"
        />
        <line
          className={styles.whisker}
          x1={minX}
          y1={2.5}
          x2={minX}
          y2={7.5}
          vectorEffect="non-scaling-stroke"
        />
        <line
          className={styles.whisker}
          x1={maxX}
          y1={2.5}
          x2={maxX}
          y2={7.5}
          vectorEffect="non-scaling-stroke"
        />
        <rect
          className={styles.box}
          x={q1X}
          y={1.5}
          width={Math.max(q3X - q1X, 0.001)}
          height={7}
          vectorEffect="non-scaling-stroke"
        />
        <line
          className={styles.median}
          x1={medX}
          y1={1.5}
          x2={medX}
          y2={8.5}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div
        className={styles.mean}
        style={{ left: `${meanX}%` }}
        aria-hidden
      />
      {tipOpen && (
        <div className={styles.tooltip} role="tooltip">
          <div>
            <span className={styles.tipLabel}>{t("max")}</span>
            <span>{fmt(stats.max)}</span>
          </div>
          <div>
            <span className={styles.tipLabel}>{t("q3")}</span>
            <span>{fmt(stats.q3)}</span>
          </div>
          <div>
            <span className={styles.tipLabel}>{t("mean")}</span>
            <span>{fmt(stats.mean)}</span>
          </div>
          <div>
            <span className={styles.tipLabel}>{t("median")}</span>
            <span>{fmt(stats.median)}</span>
          </div>
          <div>
            <span className={styles.tipLabel}>{t("q1")}</span>
            <span>{fmt(stats.q1)}</span>
          </div>
          <div>
            <span className={styles.tipLabel}>{t("min")}</span>
            <span>{fmt(stats.min)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(MiniBoxPlot);
