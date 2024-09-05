import Welcome from "@/components/Welcome";
import { generateMetadataForTool } from "@/utils/metadata";

export async function generateMetadata({ params: { locale } }) {
  return await generateMetadataForTool("home", locale);
}

export default function WelcomePage() {
  return <Welcome />;
}
