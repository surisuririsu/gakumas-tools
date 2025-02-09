import { setRequestLocale } from "next-intl/server";
import HajimeCalculator from "@/components/ProduceRankCalculator/HajimeCalculator";
import { generateMetadataForTool } from "@/utils/metadata";

export async function generateMetadata({ params }) {
  const { locale } = await params;

  return await generateMetadataForTool("produceRankCalculator", locale);
}

export default async function ProduceRankCalculatorPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HajimeCalculator />;
}
