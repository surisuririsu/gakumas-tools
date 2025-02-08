import { setRequestLocale } from "next-intl/server";
import Simulator from "@/components/Simulator";
import { generateMetadataForTool } from "@/utils/metadata";

export async function generateMetadata({ params: { locale }, searchParams }) {
  const metadata = await generateMetadataForTool("simulator", locale);
  const query = new URLSearchParams(searchParams).toString();
  metadata.openGraph.images = [`/api/preview/?${query}`];
  return metadata;
}

export default function SimulatorPage({ params: { locale } }) {
  setRequestLocale(locale);
  return <Simulator />;
}
