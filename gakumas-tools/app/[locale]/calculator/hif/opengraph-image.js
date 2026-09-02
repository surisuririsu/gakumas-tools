import { ogImageRoute, OG_SIZE, OG_CONTENT_TYPE } from "@/utils/og";

// Depends only on the locale, so prerender it at build time.
export const dynamic = "force-static";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Gakumas Tools";

export default ogImageRoute("hifCalculator", "hif");
