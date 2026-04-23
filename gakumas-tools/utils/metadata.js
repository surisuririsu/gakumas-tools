import { getTranslations } from "next-intl/server";
import { SITE_URL, alternateLanguages, localePath } from "@/utils/localeUrls";

const SITE_NAME = "Gakumas Tools";

export async function generateDefaultMetadata(locale) {
  const t = await getTranslations({ locale, namespace: "metadata" });
  return buildMetadata({
    locale,
    title: t("title"),
    description: t("description"),
    ogDescription: t("description"),
    twitterCard: "summary",
  });
}

export async function generateMetadataForTool(tool, locale, path = "") {
  const t_meta = await getTranslations({ locale, namespace: "metadata" });
  const t_tools = await getTranslations({ locale, namespace: "tools" });
  return buildMetadata({
    locale,
    path,
    title: `${t_tools(`${tool}.title`)} - ${t_meta("title")}`,
    description: `${t_tools(`${tool}.description`)} - ${t_meta("description")}`,
    ogDescription: t_tools(`${tool}.description`),
    twitterCard: "summary_large_image",
  });
}

function buildMetadata({
  locale,
  path = "",
  title,
  description,
  ogDescription,
  twitterCard,
}) {
  const url = localePath(locale, path || "/", { absolute: true });
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical: url,
      languages: alternateLanguages(path || "/"),
    },
    openGraph: {
      title,
      description: ogDescription,
      url,
      siteName: SITE_NAME,
      locale,
      type: "website",
    },
    twitter: {
      card: twitterCard,
      title,
      description: ogDescription,
    },
  };
}
