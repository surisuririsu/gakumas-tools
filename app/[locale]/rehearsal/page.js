import { setRequestLocale } from "next-intl/server";
import Rehearsal from "@/components/Rehearsal";
import { generateMetadataForTool } from "@/utils/metadata";

export async function generateMetadata({ params }) {
  const { locale } = await params;

  return await generateMetadataForTool("rehearsal", locale);
}

export default async function RehearsalPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <Rehearsal />;
}
