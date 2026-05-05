import { redirect } from "@/i18n/routing";

export default async function ReferenceIndexPage({ params }) {
  const { locale } = await params;

  redirect({ href: "/dex/reference/skill-cards", locale });
  return null;
}
