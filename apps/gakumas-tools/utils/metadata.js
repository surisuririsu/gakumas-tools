import { getTranslations } from "next-intl/server";

export async function generateDefaultMetadata(locale) {
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export async function generateMetadataForTool(tool, locale) {
  const t_meta = await getTranslations({ locale, namespace: "metadata" });
  const t_tools = await getTranslations({ locale, namespace: "tools" });

  return {
    title: `${t_tools(`${tool}.title`)} - ${t_meta("title")}`,
    description: `${t_tools(`${tool}.description`)} - ${t_meta("description")}`,
    openGraph: {
      description: t_tools(`${tool}.description`),
    },
  };
}
