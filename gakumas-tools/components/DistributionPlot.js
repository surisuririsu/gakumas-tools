import { memo, useMemo, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { CHART_COLORS, verticalGradient } from "@/components/Charts/theme";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

const CHART_OPTIONS = {
  animation: {
    delay: (ctx) =>
      ctx.type == "data" && ctx.mode == "default" ? ctx.dataIndex * 10 : 0,
  },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true },
  },
};

const CROSSHAIR_LINE_COLOR = "rgba(28, 28, 34, 0.45)";
const LABEL_BG_COLOR = "rgba(28, 28, 34, 0.92)";
const LABEL_TEXT_COLOR = "#fff";
const LABEL_FONT_SIZE = 12;
const LABEL_FONT = `600 ${LABEL_FONT_SIZE}px ${ChartJS.defaults.font.family}`;
const LABEL_PAD_X = 8;
const LABEL_PAD_Y = 4;
const LABEL_OFFSET_X = 0;
const LABEL_OFFSET_Y = 4;

function DistributionPlot({ label, data, bucketSize, color, highlight }) {
  const { counts, labels, total, cumulativeBefore } = useMemo(() => {
    const counts = Object.values(data);
    const labels = Object.keys(data).map((k) => k * bucketSize);
    const total = counts.reduce((sum, c) => sum + c, 0);
    const cumulativeBefore = [];
    let running = 0;
    for (const c of counts) {
      cumulativeBefore.push(running);
      running += c;
    }
    return { counts, labels, total, cumulativeBefore };
  }, [data, bucketSize]);

  const formattedData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label,
          data: counts,
          backgroundColor:
            color ||
            (({ chart, dataIndex }) =>
              labels[dataIndex] <= highlight &&
              highlight < labels[dataIndex] + bucketSize
                ? verticalGradient(
                    chart,
                    CHART_COLORS.highlight,
                    CHART_COLORS.highlightTop,
                  )
                : verticalGradient(chart, CHART_COLORS.bar, CHART_COLORS.barTop)),
          borderRadius: { topLeft: 4, topRight: 4 },
          borderSkipped: "bottom",
        },
      ],
    }),
    [labels, counts, label, color, highlight, bucketSize],
  );

  // Keep plugin identity stable across renders so react-chartjs-2 doesn't
  // re-register on every data change; read latest values through a ref.
  const dataRef = useRef();
  dataRef.current = { counts, labels, total, cumulativeBefore, bucketSize };

  const crosshairPlugin = useMemo(
    () => ({
      id: "crosshair",
      afterEvent: (chart, args) => {
        const { event } = args;
        const prev = chart.$crosshair || null;
        let next = prev;
        if (event.type === "mousemove" || event.type === "touchmove") {
          const { left, right } = chart.chartArea;
          next = event.x >= left && event.x <= right ? { x: event.x } : null;
        } else if (
          event.type === "mouseout" ||
          event.type === "touchend" ||
          event.type === "touchcancel"
        ) {
          next = null;
        }
        if ((prev?.x ?? null) !== (next?.x ?? null)) {
          chart.$crosshair = next;
          args.changed = true;
        }
      },
      afterDraw: (chart) => {
        const state = chart.$crosshair;
        const { counts, labels, total, cumulativeBefore, bucketSize } =
          dataRef.current;
        if (!state || !total) return;
        const { ctx, chartArea, scales } = chart;
        const { right, top, bottom } = chartArea;
        const { x } = state;
        // CategoryScale returns a fractional index centered on bars; shift so
        // the leading edge of bucket 0 maps to index 0.
        const raw = scales.x.getValueForPixel(x) + 0.5;
        const idx = Math.max(0, Math.min(counts.length - 1, Math.floor(raw)));
        const frac = Math.max(0, Math.min(1, raw - idx));
        const score = Math.round(labels[idx] + frac * bucketSize);
        const percentile =
          ((cumulativeBefore[idx] + frac * counts[idx]) / total) * 100;

        ctx.save();
        ctx.strokeStyle = CROSSHAIR_LINE_COLOR;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);
        ctx.stroke();

        const text = `${score.toLocaleString()} · P${percentile.toFixed(1)}`;
        ctx.font = LABEL_FONT;
        const boxW = ctx.measureText(text).width + LABEL_PAD_X * 2;
        const boxH = LABEL_FONT_SIZE + LABEL_PAD_Y * 2;
        let boxX = x + LABEL_OFFSET_X;
        if (boxX + boxW > right) boxX = x - LABEL_OFFSET_X - boxW;
        // Render above the chart area so tooltips (which appear near the
        // cursor inside the chart) don't overlap with the readout.
        const boxY = Math.max(2, top - LABEL_OFFSET_Y - boxH);

        ctx.fillStyle = LABEL_BG_COLOR;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 6);
        ctx.fill();
        ctx.fillStyle = LABEL_TEXT_COLOR;
        ctx.textBaseline = "top";
        ctx.fillText(text, boxX + LABEL_PAD_X, boxY + LABEL_PAD_Y);
        ctx.restore();
      },
    }),
    [],
  );

  const plugins = useMemo(() => [crosshairPlugin], [crosshairPlugin]);

  return <Bar data={formattedData} options={CHART_OPTIONS} plugins={plugins} />;
}

export default memo(DistributionPlot);
