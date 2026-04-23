import { routing } from "@/i18n/routing";
import { alternateLanguages, localePath } from "@/utils/localeUrls";

const PATHS = [
  "/",
  "/calculator/hajime/produce-rank",
  "/calculator/hajime/lesson",
  "/calculator/nia",
  "/memory-calculator",
  "/dex",
  "/memories",
  "/simulator",
  "/rehearsal",
];

export default function sitemap() {
  const lastModified = new Date();
  return PATHS.map((path) => ({
    url: localePath(routing.defaultLocale, path, { absolute: true }),
    lastModified,
    priority: path === "/" ? 1.0 : 0.7,
    alternates: { languages: alternateLanguages(path) },
  }));
}
