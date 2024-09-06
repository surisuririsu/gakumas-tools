import { unstable_setRequestLocale } from "next-intl/server";
import Rehearsal from "@/components/Rehearsal";
import { generateMetadataForTool } from "@/utils/metadata";

export async function generateMetadata({ params: { locale } }) {
  return await generateMetadataForTool("rehearsal", locale);
}

export default function RehearsalPage({ params: { locale } }) {
  unstable_setRequestLocale(locale);
  return <Rehearsal />;
}
