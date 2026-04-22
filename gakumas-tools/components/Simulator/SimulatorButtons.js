"use client";
import { memo, useContext, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  FaCheck,
  FaRegCopy,
  FaRegFloppyDisk,
  FaRegTrashCan,
  FaShareNodes,
} from "react-icons/fa6";
import Button from "@/components/Button";
import ConfirmModal from "@/components/ConfirmModal";
import LoadoutsModal from "@/components/SimulationRuns/LoadoutsModal";
import ShareModal from "@/components/ShareModal";
import LoadoutContext from "@/contexts/LoadoutContext";
import ModalContext from "@/contexts/ModalContext";
import styles from "./Simulator.module.scss";

function SimulatorButtons() {
  const t = useTranslations("SimulatorButtons");

  const { clear, simulatorUrl } = useContext(LoadoutContext);
  const { setModal } = useContext(ModalContext);
  const [linkCopied, setLinkCopied] = useState(false);
  const copiedTimerRef = useRef(null);

  useEffect(
    () => () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    },
    [],
  );

  return (
    <div className={styles.buttons} data-export-hide="true">
      <Button
        style="red-secondary"
        size="sm"
        onClick={() =>
          setModal(<ConfirmModal message={t("confirm")} onConfirm={clear} />)
        }
      >
        <FaRegTrashCan />
        <span className={styles.buttonText}>{t("clear")}</span>
      </Button>

      <Button
        style="blue-secondary"
        size="sm"
        onClick={() => setModal(<LoadoutsModal />)}
      >
        <FaRegFloppyDisk />
        <span className={styles.buttonText}>{t("openLoadouts")}</span>
      </Button>

      {!!simulatorUrl && (
        <>
          <Button
            style="blue-secondary"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(simulatorUrl);
              setLinkCopied(true);
              if (copiedTimerRef.current) {
                clearTimeout(copiedTimerRef.current);
              }
              copiedTimerRef.current = setTimeout(
                () => setLinkCopied(false),
                3000,
              );
            }}
          >
            {linkCopied ? <FaCheck /> : <FaRegCopy />}
            <span className={styles.buttonText}>URL</span>
          </Button>
          <Button
            style="blue-secondary"
            size="sm"
            onClick={() => setModal(<ShareModal url={simulatorUrl} />)}
          >
            <FaShareNodes />
            <span className={styles.buttonText}>{t("share")}</span>
          </Button>
        </>
      )}
    </div>
  );
}

export default memo(SimulatorButtons);
