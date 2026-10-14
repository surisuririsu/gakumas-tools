import sharp from "sharp";
import { IdolConfig } from "gakumas-engine";
import gkImg from "gakumas-images";
import { PItems, SkillCards } from "gakumas-data";
import Preview from "@/components/Preview";
import { CARD_SIZE, previewLayout } from "@/components/Preview/Preview.styles";
import {
  loadFonts,
  OG_SIZE,
  PREVIEW_CACHE_CONTROL,
  renderImage,
} from "@/utils/og";
import { loadoutFromSearchParams } from "@/utils/simulator";

const PNG_CACHE_LIMIT = 500;
const pngCache = new Map();

async function fetchAsPng(url, size) {
  const cacheKey = `${url}@${size}`;
  const cached = pngCache.get(cacheKey);
  if (cached !== undefined) {
    pngCache.delete(cacheKey);
    pngCache.set(cacheKey, cached);
    return cached;
  }
  let dataUrl = null;
  try {
    const res = await fetch(url);
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      const png = await sharp(buf)
        .resize(size, size, { fit: "inside", withoutEnlargement: true })
        .png()
        .toBuffer();
      dataUrl = `data:image/png;base64,${png.toString("base64")}`;
    }
  } catch (err) {
    console.warn(`preview: failed to fetch/convert ${url}:`, err?.message || err);
  }
  pngCache.set(cacheKey, dataUrl);
  if (pngCache.size > PNG_CACHE_LIMIT) {
    pngCache.delete(pngCache.keys().next().value);
  }
  return dataUrl;
}

// gkImg().icon is either a CDN URL string (when NEXT_PUBLIC_GK_IMG_BASE_URL
// is set) or a bundled image object { src: "/_next/static/media/..." } when
// unset. Normalize to a lookup key + absolute fetch URL the server can hit.
function iconKeyAndUrl(icon, origin) {
  if (!icon) return null;
  if (typeof icon === "string") return [icon, icon];
  return [icon.src, `${origin}${icon.src}`];
}

function collectIcons(loadout, idolId, origin) {
  const map = new Map();
  const add = (icon) => {
    const pair = iconKeyAndUrl(icon, origin);
    if (pair && !map.has(pair[0])) map.set(pair[0], pair[1]);
  };
  for (const id of loadout.pItemIds) {
    const item = PItems.getById(id);
    if (item) add(gkImg(item).icon);
  }
  for (const group of loadout.skillCardIdGroups) {
    for (const id of group) {
      const card = SkillCards.getById(id);
      if (card) add(gkImg(card, idolId).icon);
    }
  }
  return map;
}

export async function GET(request) {
  const url = new URL(request.url);
  const loadout = loadoutFromSearchParams(url.searchParams);
  const idolConfig = new IdolConfig(loadout);
  const { pItemIds, skillCardIdGroups, customizationGroups } = loadout;

  const isEmpty = skillCardIdGroups.every((g) => g.every((c) => c == 0));

  const layout = previewLayout(Math.min(skillCardIdGroups.length, 4), isEmpty);
  const iconSize = Math.ceil(CARD_SIZE * layout.scale);

  const icons = collectIcons(loadout, idolConfig.idolId, url.origin);
  const entries = await Promise.all(
    [...icons].map(async ([key, fetchUrl]) => [
      key,
      await fetchAsPng(fetchUrl, iconSize),
    ])
  );
  const imageMap = Object.fromEntries(entries.filter(([, v]) => v));
  const fonts = await loadFonts();

  return renderImage(
    (
      <Preview
        itemIds={pItemIds}
        skillCardIdGroups={skillCardIdGroups}
        customizationGroups={customizationGroups}
        idolId={idolConfig.idolId}
        isEmpty={isEmpty}
        imageMap={imageMap}
        layout={layout}
      />
    ),
    {
      ...OG_SIZE,
      fonts,
      headers: { "Cache-Control": PREVIEW_CACHE_CONTROL },
    }
  );
}
