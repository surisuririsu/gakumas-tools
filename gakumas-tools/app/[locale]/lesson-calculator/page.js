import { redirect } from "@/i18n/routing";

export default async function LessonCalculatorPage({ params }) {
  const { locale } = await params;

  redirect({ href: "/calculator/hajime/lesson", locale });
  return null;
}
