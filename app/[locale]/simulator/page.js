import Simulator from "@/components/Simulator";
import { generateMetadataForTool } from "@/utils/metadata";

export async function generateMetadata({ params: { locale }, searchParams }) {
  const query = new URLSearchParams(searchParams).toString();
  const metadata = await generateMetadataForTool("simulator", locale);
  metadata.openGraph.images = [`/api/preview/?${query}`];
  return metadata;
}

export default function SimulatorPage() {
  return <Simulator />;
}
