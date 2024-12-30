import { redirect } from "next/navigation";

export default function ProduceRankCalculatorPage({ params: { locale } }) {
  redirect("calculator/hajime");
  return null;
}
