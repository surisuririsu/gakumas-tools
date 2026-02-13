import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import TierListView from "@/components/TierListView";
import { connect } from "@/utils/mongodb";
import { ObjectId } from "mongodb";

export async function generateMetadata({ params }) {
  const { locale, id } = await params;
  
  if (!ObjectId.isValid(id)) {
    return {
      title: "Tier List Not Found | Gakumas Tools",
    };
  }

  try {
    const { db } = await connect();
    const tierList = await db.collection("tierLists").findOne(
      { _id: new ObjectId(id), isPublic: true },
      { projection: { title: 1, description: 1, userName: 1 } }
    );

    if (!tierList) {
      return {
        title: "Tier List Not Found | Gakumas Tools",
      };
    }

    const t = await getTranslations({ locale, namespace: "TierList" });

    return {
      title: `${tierList.title} | ${t("title")} | Gakumas Tools`,
      description: tierList.description || `${t("createdBy", { author: tierList.userName })}`,
    };
  } catch (error) {
    return {
      title: "Tier List | Gakumas Tools",
    };
  }
}

export default async function TierListViewPage({ params }) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  if (!ObjectId.isValid(id)) {
    notFound();
  }

  return <TierListView tierListId={id} />;
}