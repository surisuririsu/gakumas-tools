import { redirect } from "@/i18n/routing";

export default async function CollectionPage({ params }) {
  const { locale } = await params;

  redirect({ href: "/collection/p-idols", locale });
  return null;
}
