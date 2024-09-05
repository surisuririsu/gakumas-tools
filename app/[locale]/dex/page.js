import Dex from "@/components/Dex";
import { generateMetadataForTool } from "@/utils/metadata";

export async function generateMetadata({ params: { locale } }) {
  return await generateMetadataForTool("dex", locale);
}

export default function DexPage() {
  return <Dex />;
}
