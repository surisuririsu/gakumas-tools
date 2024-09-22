import { unstable_setRequestLocale } from "next-intl/server";
import LessonCalculator from "@/components/LessonCalculator";
import { generateMetadataForTool } from "@/utils/metadata";

export async function generateMetadata({ params: { locale } }) {
  return await generateMetadataForTool("lessonCalculator", locale);
}

export default function LessonCalculatorPage({ params: { locale } }) {
  unstable_setRequestLocale(locale);
  return <LessonCalculator />;
}
