"use client";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import ButtonGroup from "@/components/ButtonGroup";
import { useRouter, usePathname } from "@/i18n/routing";

export default function HajimeCalculatorLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Calculator");

  let currentMode = null;
  if (pathname.startsWith("/calculator/hajime/produce-rank")) {
    currentMode = "produce-rank";
  } else if (pathname.startsWith("/calculator/hajime/lesson")) {
    currentMode = "lesson";
  }

  const CALCULATOR_OPTIONS = useMemo(
    () =>
      ["produce-rank", "lesson"].map((calculator) => ({
        value: calculator,
        label: t(`calculators.${calculator}`),
      })),
    [t]
  );

  return (
    <>
      {currentMode && (
        <>
          <label>{t("calculator")}</label>
          <ButtonGroup
            options={CALCULATOR_OPTIONS}
            selected={currentMode}
            onChange={(val) => router.push(`/calculator/hajime/${val}`)}
          />
        </>
      )}
      {children}
    </>
  );
}
