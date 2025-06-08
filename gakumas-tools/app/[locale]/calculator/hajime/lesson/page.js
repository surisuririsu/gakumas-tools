import { setRequestLocale } from "next-intl/server";
import LessonCalculator from "@/components/LessonCalculator";
import { generateMetadataForTool } from "@/utils/metadata";

export async function generateMetadata({ params }) {
  const { locale } = await params;

  return await generateMetadataForTool("lessonCalculator", locale);
}

export default async function HajimeLessonCalculatorPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LessonCalculator />;
}
