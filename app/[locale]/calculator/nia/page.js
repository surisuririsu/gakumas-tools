import { setRequestLocale } from "next-intl/server";
import NiaCalculator from "@/components/ProduceRankCalculator/NiaCalculator";
import { generateMetadataForTool } from "@/utils/metadata";

export async function generateMetadata({ params }) {
  const { locale } = await params;

  return await generateMetadataForTool("niaCalculator", locale);
}

export default async function ProduceRankCalculatorPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <NiaCalculator />;
}
