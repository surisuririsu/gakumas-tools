import { routing } from "@/i18n/routing";

export const SITE_URL = "https://gktools.ris.moe";

export function localePath(locale, path = "", { absolute = false } = {}) {
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const suffix = path === "/" ? "" : path;
  const rel = `${prefix}${suffix}`;
  return absolute ? `${SITE_URL}${rel}` : rel;
}

const languagesCache = new Map();

export function alternateLanguages(path = "") {
  const cached = languagesCache.get(path);
  if (cached) return cached;
  const map = {};
  for (const locale of routing.locales) {
    map[locale] = localePath(locale, path, { absolute: true });
  }
  map["x-default"] = `${SITE_URL}${path === "/" ? "" : path}`;
  languagesCache.set(path, map);
  return map;
}
