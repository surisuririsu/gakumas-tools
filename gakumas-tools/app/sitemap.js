import { routing } from "@/i18n/routing";
import { alternateLanguages, localePath } from "@/utils/localeUrls";

const PATHS = [
  "/",
  "/calculator/hajime/produce-rank",
  "/calculator/hajime/lesson",
  "/calculator/nia",
  "/calculator/hif",
  "/memory-calculator",
  "/dex",
  "/dex/reference/skill-cards",
  "/dex/reference/p-items",
  "/dex/reference/p-drinks",
  "/dex/tier-list/skill-cards",
  "/dex/tier-list/p-items",
  "/dex/tier-list/p-drinks",
  "/dex/tier-list/p-idols",
  "/dex/collection/p-idols",
  "/memories",
  "/simulator",
  "/rehearsal",
];

// No lastModified: the sitemap is generated at build time, so a timestamp
// here would claim every page changed on every deploy.
export default function sitemap() {
  return PATHS.map((path) => ({
    url: localePath(routing.defaultLocale, path, { absolute: true }),
    priority: path === "/" ? 1.0 : 0.7,
    alternates: { languages: alternateLanguages(path) },
  }));
}
