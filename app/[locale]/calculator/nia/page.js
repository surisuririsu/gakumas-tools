import { setRequestLocale } from "next-intl/server";
import { generateMetadataForTool } from "@/utils/metadata";
import NiaCalculator from "@/components/ProduceRankCalculator/NiaCalculator";

export async function generateMetadata({ params: { locale } }) {
  return await generateMetadataForTool("niaCalculator", locale);
}

export default function ProduceRankCalculatorPage({ params: { locale } }) {
  setRequestLocale(locale);
  return <NiaCalculator />;
}
