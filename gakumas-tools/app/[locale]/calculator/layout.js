"use client";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import ButtonGroup from "@/components/ButtonGroup";
import { useRouter, usePathname } from "@/i18n/routing";
import styles from "./layout.module.scss";

export default function CalculatorLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Calculator");

  let currentScenario = null;
  if (pathname == "/calculator/hajime") {
    currentScenario = "hajime";
  } else if (pathname == "/calculator/nia") {
    currentScenario = "nia";
  }

  const SCENARIO_OPTIONS = useMemo(
    () =>
      ["hajime", "nia"].map((scenario) => ({
        value: scenario,
        label: t(scenario),
      })),
    [t]
  );

  return (
    <div className={styles.calculator}>
      {currentScenario && (
        <>
          <label>{t("scenario")}</label>
          <ButtonGroup
            options={SCENARIO_OPTIONS}
            selected={currentScenario}
            onChange={(val) => router.push(val)}
          />
        </>
      )}
      {children}
    </div>
  );
}
