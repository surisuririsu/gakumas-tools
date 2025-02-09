import { setRequestLocale } from "next-intl/server";
import Dex from "@/components/Dex";
import { generateMetadataForTool } from "@/utils/metadata";

export async function generateMetadata({ params }) {
  const { locale } = await params;

  return await generateMetadataForTool("dex", locale);
}

export default async function DexPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <Dex />;
}
