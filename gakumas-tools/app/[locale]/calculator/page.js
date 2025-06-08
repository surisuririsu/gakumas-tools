import { redirect } from "@/i18n/routing";

export default async function CalculatorPage({ params }) {
  const { locale } = await params;

  redirect({ href: "/calculator/nia", locale });
  return null;
}
