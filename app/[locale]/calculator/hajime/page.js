import { unstable_setRequestLocale } from "next-intl/server";
import { generateMetadataForTool } from "@/utils/metadata";
import HajimeCalculator from "@/components/ProduceRankCalculator/HajimeCalculator";

export async function generateMetadata({ params: { locale } }) {
  return await generateMetadataForTool("produceRankCalculator", locale);
}

export default function ProduceRankCalculatorPage({ params: { locale } }) {
  unstable_setRequestLocale(locale);
  return <HajimeCalculator />;
}
