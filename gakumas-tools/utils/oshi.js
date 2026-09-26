import { Idols } from "gakumas-data";
import { routing } from "@/i18n/routing";

export const DEFAULT_BANNER = {
  enabled: true,
  text: Object.fromEntries(routing.locales.map((locale) => [locale, ""])),
  color: "#1c85ed",
  action: "link",
  url: "",
  hasBadge: false,
  initiallyExpanded: true,
  startsAt: null,
  endsAt: null,
};

export const DEFAULT_OSHI_SETTINGS = { banners: [] };

const ACTIONS = ["link", "video"];
const MAX_BANNERS = 50;
const MAX_TEXT_LENGTH = 300;
const BANNER_ID = /^[\w-]{1,64}$/;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const YOUTUBE_ID = /^[\w-]{11}$/;
const IDOL_TOKEN = /\{([^{}]+)\}/g;

const IDOL_IDS_BY_TOKEN = Object.fromEntries(
  Idols.getAll().map(({ id, name }) => [name.split(" ").pop(), id])
);

export function idolToken(idolId) {
  return `{${Idols.getById(idolId).name.split(" ").pop()}}`;
}

export function parseOshiText(text) {
  const segments = [];
  let last = 0;
  for (const match of text.matchAll(IDOL_TOKEN)) {
    const idolId = IDOL_IDS_BY_TOKEN[match[1]];
    if (!idolId) continue;
    if (match.index > last) segments.push(text.slice(last, match.index));
    segments.push({ idolId });
    last = match.index + match[0].length;
  }
  if (last < text.length) segments.push(text.slice(last));
  return segments;
}

function parseUrl(value) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function parseDate(value) {
  return value ? new Date(value) : null;
}

function isInvalidDate(date) {
  return date != null && isNaN(date.getTime());
}

export function youTubeId(url) {
  const parsed = parseUrl(url);
  const host = parsed?.hostname.replace(/^(www|m)\./, "");
  let id = null;
  if (host == "youtu.be") {
    id = parsed.pathname.slice(1);
  } else if (host == "youtube.com") {
    id = parsed.searchParams.get("v") ?? parsed.pathname.split("/")[2];
  }
  return id && YOUTUBE_ID.test(id) ? id : null;
}

export function oshiInk(color) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 170 ? "#111" : "#fefefe";
}

function normalizeBanner(input) {
  return {
    id: String(input.id ?? ""),
    enabled: input.enabled === true,
    text: Object.fromEntries(
      routing.locales.map((locale) => [
        locale,
        String(input.text?.[locale] ?? "").trim(),
      ])
    ),
    color: String(input.color ?? ""),
    action: input.action,
    url: String(input.url ?? "").trim(),
    hasBadge: input.hasBadge === true,
    initiallyExpanded: input.initiallyExpanded === true,
    startsAt: parseDate(input.startsAt),
    endsAt: parseDate(input.endsAt),
  };
}

function findBannerError(banner) {
  const { id, enabled, text, color, action, url, startsAt, endsAt } = banner;

  if (!BANNER_ID.test(id)) {
    return "Invalid ID";
  }
  if (enabled && !text[routing.defaultLocale]) {
    return "Japanese text is required";
  }
  if (Object.values(text).some((t) => t.length > MAX_TEXT_LENGTH)) {
    return `Text must be ${MAX_TEXT_LENGTH} characters or fewer`;
  }
  if (!HEX_COLOR.test(color)) {
    return "Colour must be a hex code like #1c85ed";
  }
  if (!ACTIONS.includes(action)) {
    return "Unknown action";
  }
  if (enabled && !url) {
    return "URL is required";
  }
  if (url && !["http:", "https:"].includes(parseUrl(url)?.protocol)) {
    return "URL must start with http:// or https://";
  }
  if (url && action == "video" && !youTubeId(url)) {
    return "URL is not a YouTube video";
  }
  if (isInvalidDate(startsAt) || isInvalidDate(endsAt)) {
    return "Invalid date";
  }
  if (startsAt && endsAt && startsAt >= endsAt) {
    return '"Show until" must be after "Show from"';
  }
  return null;
}

export function validateOshiSettings(input) {
  if (!Array.isArray(input?.banners)) {
    return { error: "banners must be a list" };
  }
  if (input.banners.length > MAX_BANNERS) {
    return { error: `At most ${MAX_BANNERS} banners` };
  }

  const banners = input.banners.map((banner) => normalizeBanner(banner ?? {}));
  for (const [i, banner] of banners.entries()) {
    const error = findBannerError(banner);
    if (error) return { error: `Banner ${i + 1}: ${error}`, index: i };
  }
  if (new Set(banners.map(({ id }) => id)).size < banners.length) {
    return { error: "Banner IDs must be unique" };
  }
  return { settings: { banners } };
}

function isLive({ enabled, startsAt, endsAt }, now) {
  return enabled && (!startsAt || now >= startsAt) && (!endsAt || now < endsAt);
}

export function activeBanner(banners, now = new Date()) {
  return banners
    .filter((banner) => isLive(banner, now))
    .reduce(
      (winner, banner) =>
        !winner || (banner.startsAt ?? 0) > (winner.startsAt ?? 0)
          ? banner
          : winner,
      null
    );
}

export function bannerStatus(banner, banners, now = new Date()) {
  if (!banner.enabled) return "off";
  if (banner.startsAt && now < banner.startsAt) return "scheduled";
  if (banner.endsAt && now >= banner.endsAt) return "ended";
  return activeBanner(banners, now)?.id == banner.id ? "showing" : "hidden";
}

export function oshiProps(banner, locale) {
  const { text, color, action, url, hasBadge, initiallyExpanded } = banner;
  return {
    text: text[locale] || text[routing.defaultLocale],
    color,
    hasBadge,
    initiallyExpanded,
    ...(action == "video" ? { videoId: youTubeId(url) } : { url }),
  };
}

export function activeOshiProps(settings, locale, now = new Date()) {
  const banner = activeBanner(settings.banners, now);
  return banner && oshiProps(banner, locale);
}
