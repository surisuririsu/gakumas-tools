import { getTranslations } from "next-intl/server";

export async function generateMetadataForTool(tool, locale) {
  const t_meta = await getTranslations({ locale, namespace: "metadata" });
  const t_tool = await getTranslations({ locale, namespace: "tools" });

  return {
    title: `${t_tool(`${tool}.title`)} - ${t_meta("title")}`,
    description: `${t_tool(`${tool}.description`)} - ${t_meta("description")}`,
    openGraph: {},
  };
}
