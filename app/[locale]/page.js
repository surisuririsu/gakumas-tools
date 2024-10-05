import { unstable_setRequestLocale } from "next-intl/server";
import Welcome from "@/components/Welcome";
import { generateMetadataForTool } from "@/utils/metadata";

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Gakumas Tools",
  alternateName: "gktools.ris.moe",
  url: "https://gktools.ris.moe/",
};

export async function generateMetadata({ params: { locale } }) {
  return await generateMetadataForTool("home", locale);
}

export default function WelcomePage({ params: { locale } }) {
  unstable_setRequestLocale(locale);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <Welcome />
    </>
  );
}
