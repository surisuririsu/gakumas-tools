import { unstable_setRequestLocale } from "next-intl/server";
import Welcome from "@/components/Welcome";
import { generateMetadataForTool } from "@/utils/metadata";

export async function generateMetadata({ params: { locale } }) {
  return await generateMetadataForTool("home", locale);
}

export default function WelcomePage({ params: { locale } }) {
  unstable_setRequestLocale(locale);
  return <Welcome />;
}
