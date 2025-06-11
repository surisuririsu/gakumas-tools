import { setRequestLocale } from "next-intl/server";
import CardClassifier from "@/components/CardClassifier";
import { generateMetadataForTool } from "@/utils/metadata";

export async function generateMetadata({ params }) {
  const { locale } = await params;

  return await generateMetadataForTool("rehearsal", locale);
}

export default async function CardClassifierPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CardClassifier />;
}
