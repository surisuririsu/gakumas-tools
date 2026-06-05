"use client";
import ScenarioPicker from "@/components/ScenarioPicker";
import { usePathname } from "@/i18n/routing";
import { SCENARIOS } from "@/utils/scenarios";
import styles from "./layout.module.scss";

export default function CalculatorLayout({ children }) {
  const pathname = usePathname();

  const currentScenario =
    SCENARIOS.find((s) => pathname.startsWith(`/calculator/${s}`)) || null;

  return (
    <div className={styles.calculator}>
      {currentScenario && <ScenarioPicker selected={currentScenario} />}
      {children}
    </div>
  );
}
