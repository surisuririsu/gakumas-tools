import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE_URL } from "@/utils/localeUrls";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const SITE_NAME = "Gakumas Tools";
const SITE_HOST = new URL(SITE_URL).host;

// Subsets contain only the glyphs used in tool/site titles (see assets/fonts).
const FONT_BY_LOCALE = {
  ja: "NotoSansCJKjp-Bold-subset.otf",
  en: "NotoSansCJKjp-Bold-subset.otf",
  ko: "NotoSansCJKkr-Bold-subset.otf",
  "zh-Hans": "NotoSansCJKsc-Bold-subset.otf",
};

// Color stops sampled from the in-game scenario logo art.
const THEMES = {
  brand: { stops: ["#f39800", "#ffb73d"], seed: 7 },
  hajime: {
    stops: ["#8c4e35", "#bc8763", "#e0ba9b"],
    accents: [
      { stops: ["#f4d6bb", "#fdefdd"], chance: 0.15 }, // cream petals
    ],
    scenario: "hajime",
    seed: 1,
  },
  nia: {
    stops: ["#5533bb", "#7744dd", "#9966ee"],
    accents: [
      { stops: ["#ddd4f5", "#f5f2fd"], chance: 0.04 }, // white sparkles
      { stops: ["#e5ba30", "#edd070"], chance: 0.04 }, // gold sparkles
    ],
    scenario: "nia",
    // Seed chosen so no accent tiles land under the heading or wordmark.
    seed: 36,
  },
  hif: {
    stops: ["#5164f2", "#646bb7", "#7755dd", "#8085ef"],
    accents: [
      { stops: ["#f2d07f", "#e0b468"], chance: 0.11 }, // gold frames
      { stops: ["#b1bdf0", "#d4dbf8"], chance: 0.07 }, // light lavender
      { stops: ["#2a1e73", "#473aa0"], chance: 0.05 }, // deep violet panes
      { stops: ["#cda994", "#e0c0b0"], chance: 0.04 }, // warm rosy glass
    ],
    scenario: "hif",
    seed: 3,
  },
};

// Deterministic PRNG so each theme's mesh is stable across renders.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lerpStops(stops, t) {
  const rgbs = stops.map(hexToRgb);
  const seg = Math.min(t, 0.9999) * (rgbs.length - 1);
  const i = Math.floor(seg);
  const f = seg - i;
  return rgbs[i].map((c, k) => c + (rgbs[i + 1][k] - c) * f);
}

function shade(rgb, factor) {
  return `rgb(${rgb
    .map((c) => Math.round(Math.min(255, Math.max(0, c * factor))))
    .join(",")})`;
}

function triangleTilesSvg({ stops, accents, seed }) {
  const { width: W, height: H } = OG_SIZE;
  const SIDE = 210;
  const TILE_HEIGHT = (SIDE * Math.sqrt(3)) / 2;
  const rand = mulberry32(seed);

  // Mid-theme backdrop so antialiasing seams between tiles never show.
  const baseFill = shade(lerpStops(stops, 0.5), 1);

  let defs = "";
  let polys = "";
  let n = 0;

  const addTile = (points) => {
    const cx = (points[0][0] + points[1][0] + points[2][0]) / 3;
    const cy = (points[0][1] + points[1][1] + points[2][1]) / 3;
    // Noise keeps the gradient sweep from visibly anchoring to a corner.
    const t = Math.min(
      1,
      Math.max(0, (cx + cy * 0.35) / (W + H * 0.35) + (rand() - 0.5) * 0.45),
    );
    const base = lerpStops(stops, t);
    const jitter = 1 + (rand() - 0.5) * 0.22;
    // Accents tint only the light stop, blending into the base color.
    const accent = accents?.find((a) => rand() < a.chance);
    const light = accent
      ? shade(lerpStops(accent.stops, rand()), 1 + rand() * 0.08)
      : shade(base, (1 + rand() * 0.14) * jitter);
    const dark = shade(base, (0.86 + rand() * 0.1) * jitter);
    const angle = rand() * Math.PI * 2;
    const radius = SIDE / 2;
    const x1 = cx - Math.cos(angle) * radius;
    const y1 = cy - Math.sin(angle) * radius;
    const x2 = cx + Math.cos(angle) * radius;
    const y2 = cy + Math.sin(angle) * radius;
    defs += `<linearGradient id="g${n}" gradientUnits="userSpaceOnUse" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></linearGradient>`;
    const pts = points
      .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
      .join(" ");
    polys += `<polygon points="${pts}" fill="url(#g${n})"/>`;
    n++;
  };

  const rows = Math.ceil(H / TILE_HEIGHT);
  for (let r = 0; r < rows; r++) {
    const y = r * TILE_HEIGHT;
    const xOffset = r % 2 === 0 ? 0 : -SIDE / 2;
    for (let x = xOffset - SIDE; x < W + SIDE; x += SIDE) {
      addTile([
        [x, y + TILE_HEIGHT],
        [x + SIDE, y + TILE_HEIGHT],
        [x + SIDE / 2, y],
      ]);
      addTile([
        [x + SIDE / 2, y],
        [x + SIDE * 1.5, y],
        [x + SIDE, y + TILE_HEIGHT],
      ]);
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>${defs}</defs><rect width="${W}" height="${H}" fill="${baseFill}"/>${polys}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const fontCache = new Map();
function loadFont(locale) {
  const file = FONT_BY_LOCALE[locale] ?? FONT_BY_LOCALE.ja;
  if (!fontCache.has(file)) {
    fontCache.set(file, readFile(join(process.cwd(), "assets/fonts", file)));
  }
  return fontCache.get(file);
}

export function ogImageRoute(tool, themeKey) {
  return async function Image({ params }) {
    const { locale } = await params;
    return toolOgImage(locale, tool, themeKey);
  };
}

export async function toolOgImage(locale, tool, themeKey = "brand") {
  const theme = THEMES[themeKey];
  const messages = (await import(`@/messages/${locale}.json`)).default;
  const toolMessages = messages.tools?.[tool] ?? {};
  // The tool's own title would repeat the scenario name in the heading.
  const heading = theme.scenario
    ? messages.Calculator?.scenarios?.[theme.scenario]
    : SITE_NAME;
  const subheading = theme.scenario
    ? messages.tools?.produceRankCalculator?.title
    : (toolMessages.metaTitle ?? toolMessages.title);
  const fontData = await loadFont(locale);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          fontFamily: "Noto Sans",
          color: "#ffffff",
        }}
      >
        <img
          src={triangleTilesSvg(theme)}
          width={OG_SIZE.width}
          height={OG_SIZE.height}
          style={{ position: "absolute", top: 0, left: 0 }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.02) 40%, rgba(0,0,0,0.25) 100%)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: "64px 80px 56px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 130,
                fontWeight: 700,
                lineHeight: 1.1,
                textShadow: "0 4px 16px rgba(0, 0, 0, 0.25)",
              }}
            >
              {heading}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 54,
                fontWeight: 700,
                marginTop: 16,
                textShadow: "0 2px 10px rgba(0, 0, 0, 0.25)",
              }}
            >
              {subheading}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 38,
                fontWeight: 700,
                textShadow: "0 2px 8px rgba(0, 0, 0, 0.25)",
              }}
            >
              {/* The brand card's heading is already the site name. */}
              {theme.scenario ? (messages.metadata?.title ?? SITE_NAME) : ""}
            </div>
            <div style={{ display: "flex", fontSize: 26, opacity: 0.9 }}>
              {SITE_HOST}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [{ name: "Noto Sans", data: fontData, weight: 700 }],
    },
  );
}
