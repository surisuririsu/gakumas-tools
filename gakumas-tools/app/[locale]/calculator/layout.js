"use client";
import ScenarioPicker from "@/components/ScenarioPicker";
import { useRouter, usePathname } from "@/i18n/routing";
import { SCENARIOS } from "@/utils/scenarios";
import styles from "./layout.module.scss";

export default function CalculatorLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const currentScenario =
    SCENARIOS.find((s) => pathname.startsWith(`/calculator/${s}`)) || null;

  return (
    <div className={styles.calculator}>
      {currentScenario && (
        <ScenarioPicker
          selected={currentScenario}
          onChange={(val) => router.push(`/calculator/${val}`)}
        />
      )}
      {children}
    </div>
  );
}
