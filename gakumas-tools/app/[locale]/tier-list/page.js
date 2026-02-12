import { setRequestLocale } from "next-intl/server";
import TierListHub from "@/components/TierListHub";
import { generateMetadataForTool } from "@/utils/metadata";

export async function generateMetadata({ params }) {
  const { locale } = await params;

  return await generateMetadataForTool("tierLists", locale);
}

export default async function TierListPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <TierListHub />;
}