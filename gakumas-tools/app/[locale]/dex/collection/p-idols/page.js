import { setRequestLocale } from "next-intl/server";
import PIdolCollection from "@/components/PIdolCollection";
import { generateMetadataForTool } from "@/utils/metadata";

export async function generateMetadata({ params }) {
  const { locale } = await params;

  return await generateMetadataForTool(
    "pIdolCollection",
    locale,
    "/dex/collection/p-idols",
  );
}

export default async function PIdolsCollectionPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PIdolCollection />;
}
