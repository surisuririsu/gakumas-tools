import Rehearsal from "@/components/Rehearsal";
import { generateMetadataForTool } from "@/utils/metadata";

export async function generateMetadata({ params: { locale } }) {
  return await generateMetadataForTool("rehearsal", locale);
}

export default function RehearsalPage() {
  return <Rehearsal />;
}
