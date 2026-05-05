import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import EntityReference from "@/components/EntityReference";
import { routing } from "@/i18n/routing";
import { EntityTypes } from "@/utils/entities";
import { generateMetadataForTool } from "@/utils/metadata";

const TYPE_BY_SLUG = {
  "skill-cards": EntityTypes.SKILL_CARD,
  "p-items": EntityTypes.P_ITEM,
  "p-drinks": EntityTypes.P_DRINK,
};

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    Object.keys(TYPE_BY_SLUG).map((type) => ({ locale, type })),
  );
}

export async function generateMetadata({ params }) {
  const { locale, type } = await params;

  return await generateMetadataForTool(
    "dex",
    locale,
    `/dex/reference/${type}`,
  );
}

export default async function ReferencePage({ params }) {
  const { locale, type } = await params;
  setRequestLocale(locale);

  const entityType = TYPE_BY_SLUG[type];
  if (!entityType) notFound();

  return <EntityReference type={entityType} />;
}
