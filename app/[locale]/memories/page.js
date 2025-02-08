import { setRequestLocale } from "next-intl/server";
import Memories from "@/components/Memories";
import { generateMetadataForTool } from "@/utils/metadata";

export async function generateMetadata({ params }) {
  const { locale } = await params;

  return await generateMetadataForTool("memories", locale);
}

export default async function MemoriesPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <Memories />;
}
