import { ImageResponse } from "next/og";
import sharp from "sharp";
import TierListPreview from "@/components/TierListPreview";
import {
  ITEM_GAP,
  ITEMS_PADDING,
  ITEM_SIZE,
  MIN_ROW_HEIGHT,
  PREVIEW_PADDING,
  PREVIEW_WIDTH,
  TIER_LABEL_WIDTH,
} from "@/components/TierListPreview/TierListPreview.styles";
import {
  ENTITY_DATA_BY_TYPE,
  EntityTypes,
  resolveEntityIcon,
} from "@/utils/entities";
import { decodeList, EMPTY_LIST } from "@/utils/tierList";

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
    console.warn(`tier-list-preview: failed ${url}:`, err?.message || err);
  }
  pngCache.set(url, dataUrl);
  if (pngCache.size > PNG_CACHE_LIMIT) {
    pngCache.delete(pngCache.keys().next().value);
  }
  return dataUrl;
}

function iconToFetchUrl(icon, origin) {
  if (!icon) return null;
  if (typeof icon === "string") return icon;
  return `${origin}${icon.src}`;
}

function iconKey(icon) {
  if (!icon) return null;
  return typeof icon === "string" ? icon : icon.src;
}

async function fetchAll(entries) {
  const arr = await Promise.all(
    entries.map(async ([k, url]) => [k, await fetchAsPng(url)]),
  );
  return Object.fromEntries(arr.filter(([, v]) => v));
}

function rowHeight(itemCount, columns) {
  if (itemCount === 0) return MIN_ROW_HEIGHT;
  const lines = Math.ceil(itemCount / columns);
  const itemsHeight =
    lines * ITEM_SIZE + (lines - 1) * ITEM_GAP + ITEMS_PADDING * 2;
  return Math.max(MIN_ROW_HEIGHT, itemsHeight);
}

export async function GET(request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const ENTITY_DATA = ENTITY_DATA_BY_TYPE[type];
  if (!ENTITY_DATA) {
    return new Response("Invalid type", { status: 400 });
  }

  const list = decodeList(url.searchParams.get("d")) || EMPTY_LIST;

  const rankUrls = list.tiers.map((rank) => [
    rank,
    `${url.origin}/ranks/${rank}.png`,
  ]);

  const itemEntries = [];
  for (const rank of list.tiers) {
    for (const id of list.items[rank] || []) {
      const entity = ENTITY_DATA.getById(id);
      if (!entity) continue;
      const icon = resolveEntityIcon(entity);
      const fetchUrl = iconToFetchUrl(icon, url.origin);
      const key = iconKey(icon);
      if (key && fetchUrl) itemEntries.push([id, key, fetchUrl]);
    }
  }

  const [rankSrc, iconCache] = await Promise.all([
    fetchAll(rankUrls),
    fetchAll(itemEntries.map(([, key, fetchUrl]) => [key, fetchUrl])),
  ]);

  const itemSrc = {};
  for (const [id, key] of itemEntries) {
    if (iconCache[key]) itemSrc[id] = iconCache[key];
  }

  const itemsAreaWidth = PREVIEW_WIDTH - PREVIEW_PADDING * 2 - TIER_LABEL_WIDTH;
  const columns = Math.max(
    1,
    Math.floor(
      (itemsAreaWidth - ITEMS_PADDING * 2 + ITEM_GAP) / (ITEM_SIZE + ITEM_GAP),
    ),
  );

  let height = PREVIEW_PADDING * 2;
  for (const rank of list.tiers) {
    height += rowHeight((list.items[rank] || []).length, columns);
  }

  return new ImageResponse(
    <TierListPreview list={list} rankSrc={rankSrc} itemSrc={itemSrc} />,
    { width: PREVIEW_WIDTH, height },
  );
}
