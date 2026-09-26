import { Idols } from "gakumas-data";
import { routing } from "@/i18n/routing";

export const DEFAULT_OSHI_SETTINGS = {
  enabled: false,
  text: Object.fromEntries(routing.locales.map((locale) => [locale, ""])),
  idolId: null,
  color: "#1c85ed",
  action: "link",
  url: "",
  hasBadge: false,
  initiallyExpanded: true,
  startsAt: null,
  endsAt: null,
};

const ACTIONS = ["link", "video"];
const MAX_TEXT_LENGTH = 300;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const YOUTUBE_ID = /^[\w-]{11}$/;

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

function normalize(input) {
  return {
    enabled: input.enabled === true,
    text: Object.fromEntries(
      routing.locales.map((locale) => [
        locale,
        String(input.text?.[locale] ?? "").trim(),
      ])
    ),
    idolId: input.idolId ?? null,
    color: String(input.color ?? ""),
    action: input.action,
    url: String(input.url ?? "").trim(),
    hasBadge: input.hasBadge === true,
    initiallyExpanded: input.initiallyExpanded === true,
    startsAt: parseDate(input.startsAt),
    endsAt: parseDate(input.endsAt),
  };
}

function findError(settings) {
  const { enabled, text, idolId, color, action, url, startsAt, endsAt } =
    settings;

  if (enabled && !text[routing.defaultLocale]) {
    return "Japanese text is required";
  }
  if (Object.values(text).some((t) => t.length > MAX_TEXT_LENGTH)) {
    return `Text must be ${MAX_TEXT_LENGTH} characters or fewer`;
  }
  if (idolId != null && !(Number.isInteger(idolId) && Idols.getById(idolId))) {
    return "Unknown idol";
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
  const settings = normalize(input ?? {});
  const error = findError(settings);
  return error ? { error } : { settings };
}

export function oshiProps(settings, locale) {
  const { text, idolId, color, action, url, hasBadge, initiallyExpanded } =
    settings;
  return {
    text: text[locale] || text[routing.defaultLocale],
    idolId,
    color,
    hasBadge,
    initiallyExpanded,
    ...(action == "video" ? { videoId: youTubeId(url) } : { url }),
  };
}

export function activeOshiProps(settings, locale, now = new Date()) {
  const { enabled, startsAt, endsAt } = settings;
  if (!enabled) return null;
  if (startsAt && now < startsAt) return null;
  if (endsAt && now >= endsAt) return null;
  return oshiProps(settings, locale);
}
