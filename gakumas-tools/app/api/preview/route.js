import { ImageResponse } from "next/og";
import sharp from "sharp";
import { IdolConfig } from "gakumas-engine";
import gkImg from "gakumas-images";
import { PItems, SkillCards } from "gakumas-data";
import Preview from "@/components/Preview";
import { loadoutFromSearchParams } from "@/utils/simulator";

const PNG_CACHE_LIMIT = 500;
const pngCache = new Map();

async function fetchAsPng(url) {
  const cached = pngCache.get(url);
  if (cached !== undefined) {
    pngCache.delete(url);
    pngCache.set(url, cached);
    return cached;
  }
  let dataUrl = null;
  try {
    const res = await fetch(url);
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      const png = await sharp(buf).png().toBuffer();
      dataUrl = `data:image/png;base64,${png.toString("base64")}`;
    }
  } catch (err) {
    console.warn(`preview: failed to fetch/convert ${url}:`, err?.message || err);
  }
  pngCache.set(url, dataUrl);
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

  const height =
    32 + // Padding
    48 + // P-Items
    (8 + 68 + (isEmpty ? 0 : 26)) * Math.min(skillCardIdGroups.length, 4); // Gap + cards + cost row

  const icons = collectIcons(loadout, idolConfig.idolId, url.origin);
  const entries = await Promise.all(
    [...icons].map(async ([key, fetchUrl]) => [key, await fetchAsPng(fetchUrl)])
  );
  const imageMap = Object.fromEntries(entries.filter(([, v]) => v));

  return new ImageResponse(
    (
      <Preview
        itemIds={pItemIds}
        skillCardIdGroups={skillCardIdGroups}
        customizationGroups={customizationGroups}
        idolId={idolConfig.idolId}
        isEmpty={isEmpty}
        imageMap={imageMap}
      />
    ),
    { width: 470, height }
  );
}
