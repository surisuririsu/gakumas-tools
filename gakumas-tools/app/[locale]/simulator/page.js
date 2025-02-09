import { setRequestLocale } from "next-intl/server";
import Simulator from "@/components/Simulator";
import { generateMetadataForTool } from "@/utils/metadata";

export async function generateMetadata({ params, searchParams }) {
  const { locale } = await params;
  const metadata = await generateMetadataForTool("simulator", locale);
  const query = new URLSearchParams(await searchParams).toString();
  metadata.openGraph.images = [`/api/preview/?${query}`];

  return metadata;
}

export default async function SimulatorPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <Simulator />;
}
