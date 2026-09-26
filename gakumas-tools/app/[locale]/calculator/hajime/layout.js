"use client";
import CalculatorSwitch from "@/components/ProduceRankCalculator/CalculatorSwitch";
import { usePathname } from "@/i18n/routing";

export default function HajimeCalculatorLayout({ children }) {
  const pathname = usePathname();

  let currentMode = null;
  if (pathname.startsWith("/calculator/hajime/produce-rank")) {
    currentMode = "produce-rank";
  } else if (pathname.startsWith("/calculator/hajime/lesson")) {
    currentMode = "lesson";
  }

  return (
    <>
      {currentMode && <CalculatorSwitch selected={currentMode} />}
      {children}
    </>
  );
}
