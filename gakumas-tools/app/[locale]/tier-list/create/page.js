import { setRequestLocale, getTranslations } from "next-intl/server";
import TierListEditor from "@/components/TierListEditor";

export async function generateMetadata({ params, searchParams }) {
  const { locale } = await params;
  const editId = (await searchParams).edit;
  const t = await getTranslations({ locale, namespace: "TierList" });

  return {
    title: `${editId ? t("edit") : t("createNew")} | ${t("title")} | Gakumas Tools`,
    description: t("createNew"),
  };
}

export default async function TierListCreatePage({ params, searchParams }) {
  const { locale } = await params;
  const editId = (await searchParams).edit;
  setRequestLocale(locale);

  return <TierListEditor editId={editId} />;
}