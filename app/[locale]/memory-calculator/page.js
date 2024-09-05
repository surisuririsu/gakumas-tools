import MemoryCalculator from "@/components/MemoryCalculator";
import { generateMetadataForTool } from "@/utils/metadata";

export async function generateMetadata({ params: { locale } }) {
  return await generateMetadataForTool("memoryCalculator", locale);
}

export default function MemoryCalculatorPage() {
  return <MemoryCalculator />;
}
