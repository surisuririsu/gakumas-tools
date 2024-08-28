"use client";
import { memo, useContext, useState } from "react";
import { FaCheck, FaRegCopy } from "react-icons/fa6";
import Button from "@/components/Button";
import LoadoutContext from "@/contexts/LoadoutContext";
import styles from "./Simulator.module.scss";

function SimulatorButtons() {
  const { clear, simulatorUrl } = useContext(LoadoutContext);
  const [linkCopied, setLinkCopied] = useState(false);

  return (
    <div className={styles.buttons}>
      <Button
        style="red-secondary"
        onClick={() => {
          if (confirm("Are you sure you want to clear the loadout?")) {
            clear();
          }
        }}
      >
        クリア
      </Button>

      <Button
        style="secondary"
        onClick={() => {
          navigator.clipboard.writeText(simulatorUrl);
          setLinkCopied(true);
          setTimeout(() => setLinkCopied(false), 3000);
        }}
      >
        {linkCopied ? (
          <FaCheck />
        ) : (
          <>
            <FaRegCopy />
            URL
          </>
        )}
      </Button>
    </div>
  );
}

export default memo(SimulatorButtons);
