import { redirect } from "@/i18n/routing";

export default async function CollectionIndexPage({ params }) {
  const { locale } = await params;

  redirect({ href: "/dex/collection/p-idols", locale });
  return null;
}
