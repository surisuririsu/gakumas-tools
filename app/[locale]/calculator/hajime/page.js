import { setRequestLocale } from "next-intl/server";
import { generateMetadataForTool } from "@/utils/metadata";
import HajimeCalculator from "@/components/ProduceRankCalculator/HajimeCalculator";

export async function generateMetadata({ params }) {
  const { locale } = await params;

  return await generateMetadataForTool("produceRankCalculator", locale);
}

export default async function ProduceRankCalculatorPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HajimeCalculator />;
}
