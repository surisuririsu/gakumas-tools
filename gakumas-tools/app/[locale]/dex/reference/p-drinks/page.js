import { setRequestLocale } from "next-intl/server";
import EntityReference from "@/components/EntityReference";
import { EntityTypes } from "@/utils/entities";
import { generateMetadataForTool } from "@/utils/metadata";

export async function generateMetadata({ params }) {
  const { locale } = await params;

  return await generateMetadataForTool(
    "dex",
    locale,
    "/dex/reference/p-drinks",
  );
}

export default async function PDrinksReferencePage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <EntityReference type={EntityTypes.P_DRINK} />;
}
