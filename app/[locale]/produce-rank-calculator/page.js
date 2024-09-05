import ProduceRankCalculator from "@/components/ProduceRankCalculator";
import { generateMetadataForTool } from "@/utils/metadata";

export async function generateMetadata({ params: { locale } }) {
  return await generateMetadataForTool("produceRankCalculator", locale);
}

export default function ProduceRankCalculatorPage() {
  return <ProduceRankCalculator />;
}
