import { redirect } from "@/i18n/routing";

export default function ProduceRankCalculatorPage({ params: { locale } }) {
  redirect({ href: "calculator/nia", locale });
  return null;
}
