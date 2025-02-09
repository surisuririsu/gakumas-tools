import { setRequestLocale } from "next-intl/server";
import MemoryCalculator from "@/components/MemoryCalculator";
import { generateMetadataForTool } from "@/utils/metadata";

export async function generateMetadata({ params }) {
  const { locale } = await params;

  return await generateMetadataForTool("memoryCalculator", locale);
}

export default async function MemoryCalculatorPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <MemoryCalculator />;
}
