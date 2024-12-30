"use client";
import { useMemo } from "react";
import { useRouter, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import ButtonGroup from "@/components/ButtonGroup";
import styles from "./layout.module.scss";

export default function CalculatorLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Calculator");

  const currentScenario = pathname == "/calculator/hajime" ? "hajime" : "nia";

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
      <label>{t("scenario")}</label>
      <ButtonGroup
        options={SCENARIO_OPTIONS}
        selected={currentScenario}
        onChange={(val) => router.push(val)}
      />
      {children}
    </div>
  );
}
