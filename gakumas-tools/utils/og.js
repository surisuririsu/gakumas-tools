import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import HomeCard from "@/components/OgImage/HomeCard";
import ScenarioCard from "@/components/OgImage/ScenarioCard";
import {
  SCENARIO_COLORS,
  WATERMARK_FONT_FAMILY,
} from "@/components/OgImage/theme";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

export const PREVIEW_CACHE_CONTROL =
  "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400";

// resvg refuses anything over 32767px per side, and well below that a render
// can still take minutes and hundreds of MB.
const MAX_IMAGE_PIXELS = 720 * 4000;

// ImageResponse renders inside its body stream, where a satori/resvg failure
// would abort an already-started 200 and surface as a bare 502 with no log.
export async function renderImage(element, options) {
  if (options.width * options.height > MAX_IMAGE_PIXELS) {
    return new Response("Image too large", { status: 400 });
  }
  try {
    const response = new ImageResponse(element, options);
    const body = await response.arrayBuffer();
    return new Response(body, { status: 200, headers: response.headers });
  } catch (err) {
    console.error("image render failed:", err);
    return new Response("Image render failed", { status: 500 });
  }
}

const INTER_FILES = {
  600: "Inter-SemiBold-latin.woff",
  700: "Inter-Bold-latin.woff",
  800: "Inter-ExtraBold-latin.woff",
};

// Subsets contain only the glyphs used in tool/site titles and 学マスツール.
const CJK_FILE_BY_LOCALE = {
  ja: "NotoSansCJKjp-Bold-subset.otf",
  en: "NotoSansCJKjp-Bold-subset.otf",
  ko: "NotoSansCJKkr-Bold-subset.otf",
  "zh-Hans": "NotoSansCJKsc-Bold-subset.otf",
};

const fileCache = new Map();
function readAsset(...segments) {
  const path = join(process.cwd(), ...segments);
  if (!fileCache.has(path)) fileCache.set(path, readFile(path));
  return fileCache.get(path);
}

export async function loadFonts(locale) {
  const fonts = await Promise.all(
    Object.entries(INTER_FILES).map(async ([weight, file]) => ({
      name: "Inter",
      weight: Number(weight),
      data: await readAsset("assets/fonts", file),
    })),
  );
  if (!locale) return fonts;
  const [cjk, watermark] = await Promise.all([
    readAsset(
      "assets/fonts",
      CJK_FILE_BY_LOCALE[locale] ?? CJK_FILE_BY_LOCALE.ja,
    ),
    readAsset("assets/fonts", CJK_FILE_BY_LOCALE.ja),
  ]);
  return [
    ...fonts,
    { name: "Noto Sans", weight: 700, data: cjk },
    { name: WATERMARK_FONT_FAMILY, weight: 700, data: watermark },
  ];
}

async function rankImageSrc(rank) {
  const png = await readAsset("public/ranks", `${rank}.png`);
  return `data:image/png;base64,${png.toString("base64")}`;
}

const BADGE_RANKS = ["S5", "S4+", "S4", "SSS+"];

async function scenarioCard(locale, scenario) {
  const [messages, badges] = await Promise.all([
    import(`@/messages/${locale}.json`).then((module) => module.default),
    Promise.all(
      BADGE_RANKS.map(async (rank) => ({
        rank,
        src: await rankImageSrc(rank),
      })),
    ),
  ]);
  return (
    <ScenarioCard
      scenarioName={messages.Calculator.scenarios[scenario]}
      title={messages.tools.produceRankCalculator.title}
      colors={SCENARIO_COLORS[scenario]}
      badges={badges}
    />
  );
}

export function ogImageRoute(scenario) {
  return async function Image({ params }) {
    const { locale } = await params;
    const [card, fonts] = await Promise.all([
      scenario ? scenarioCard(locale, scenario) : <HomeCard />,
      loadFonts(locale),
    ]);
    return renderImage(card, { ...OG_SIZE, fonts });
  };
}
