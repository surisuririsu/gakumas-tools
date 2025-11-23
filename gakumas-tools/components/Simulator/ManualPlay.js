import { useMemo } from "react";
import { FaCircleArrowUp } from "react-icons/fa6";
import Logs from "@/components/SimulatorLogs/Logs";
import { structureLogs } from "@/utils/simulator";
import HoldModal from "./HoldModal";
import styles from "./ManualPlay.module.scss";

export default function ManualPlay({
  logs,
  pendingDecision,
  onDecision,
  idolId,
}) {
  const structuredLogs = useMemo(() => structureLogs(logs), [logs]);

  return (
    <div className={styles.manualPlay}>
      {structuredLogs && (
        <>
          <Logs
            logs={structuredLogs}
            idolId={idolId}
            pendingDecision={pendingDecision}
            onDecision={onDecision}
          />

          <a className={styles.toTop} href="#simulator_loadout">
            Top
            <FaCircleArrowUp />
          </a>
        </>
      )}
      {pendingDecision?.type === "HOLD_SELECTION" && (
        <HoldModal
          decision={pendingDecision}
          onDecision={onDecision}
          idolId={idolId}
        />
      )}
    </div>
  );
}
