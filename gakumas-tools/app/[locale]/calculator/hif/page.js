import { setRequestLocale } from "next-intl/server";
import HifCalculator from "@/components/ProduceRankCalculator/HifCalculator";
import { generateMetadataForTool } from "@/utils/metadata";

export async function generateMetadata({ params }) {
  const { locale } = await params;

  return await generateMetadataForTool("hifCalculator", locale);
}

export default async function HifProduceRankCalculatorPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HifCalculator />;
}
