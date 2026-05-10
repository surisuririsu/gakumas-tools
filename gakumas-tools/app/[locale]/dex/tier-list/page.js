import { redirect } from "@/i18n/routing";

export default async function TierListIndexPage({ params }) {
  const { locale } = await params;

  redirect({ href: "/dex/tier-list/skill-cards", locale });
  return null;
}
