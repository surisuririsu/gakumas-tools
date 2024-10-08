import { unstable_setRequestLocale } from "next-intl/server";
import Memories from "@/components/Memories";
import { generateMetadataForTool } from "@/utils/metadata";

export async function generateMetadata({ params: { locale } }) {
  return await generateMetadataForTool("memories", locale);
}

export default function MemoriesPage({ params: { locale } }) {
  unstable_setRequestLocale(locale);
  return <Memories />;
}
