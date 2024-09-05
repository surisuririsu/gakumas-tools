import Memories from "@/components/Memories";
import { generateMetadataForTool } from "@/utils/metadata";

export async function generateMetadata({ params: { locale } }) {
  return await generateMetadataForTool("memories", locale);
}

export default function MemoriesPage() {
  return <Memories />;
}
