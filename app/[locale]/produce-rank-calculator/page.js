import { redirect } from "@/i18n/routing";

export default function ProduceRankCalculatorPage({ params: { locale } }) {
  redirect("calculator/nia");
  return null;
}
