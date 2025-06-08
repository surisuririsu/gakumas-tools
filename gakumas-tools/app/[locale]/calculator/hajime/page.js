import { redirect } from "@/i18n/routing";

export default async function HajimeCalculatorPage({ params }) {
  const { locale } = await params;

  redirect({ href: "/calculator/hajime/produce-rank", locale });
  return null;
}
