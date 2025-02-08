import { redirect } from "@/i18n/routing";

export default function CalculatorPage({ params: { locale } }) {
  redirect({ href: "calculator/nia", locale });
  return null;
}
