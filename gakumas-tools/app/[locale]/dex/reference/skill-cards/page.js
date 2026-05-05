import { setRequestLocale } from "next-intl/server";
import EntityReference from "@/components/EntityReference";
import { EntityTypes } from "@/utils/entities";
import { generateMetadataForTool } from "@/utils/metadata";

export async function generateMetadata({ params }) {
  const { locale } = await params;

  return await generateMetadataForTool(
    "dex",
    locale,
    "/dex/reference/skill-cards",
  );
}

export default async function SkillCardsReferencePage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <EntityReference type={EntityTypes.SKILL_CARD} />;
}
