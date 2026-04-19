"use client";
import { memo, useContext, useState } from "react";
import { useTranslations } from "next-intl";
import {
  FaCheck,
  FaClockRotateLeft,
  FaFloppyDisk,
  FaRegCopy,
  FaRegTrashCan,
  FaShareNodes,
} from "react-icons/fa6";
import Button from "@/components/Button";
import ConfirmModal from "@/components/ConfirmModal";
import LoadoutHistory from "@/components/LoadoutHistory";
import LoadoutManagerModal from "@/components/LoadoutManagerModal";
import Modal from "@/components/Modal";
import ShareModal from "@/components/ShareModal";
import LoadoutContext from "@/contexts/LoadoutContext";
import LoadoutHistoryContext from "@/contexts/LoadoutHistoryContext";
import ModalContext from "@/contexts/ModalContext";
import styles from "./Simulator.module.scss";

function HistoryModal() {
  return (
    <Modal>
      <LoadoutHistory />
    </Modal>
  );
}

function SimulatorButtons() {
  const t = useTranslations("SimulatorButtons");

  const { clear, simulatorUrl, stage } = useContext(LoadoutContext);
  const { loadoutHistory } = useContext(LoadoutHistoryContext);
  const { setModal } = useContext(ModalContext);
  const [linkCopied, setLinkCopied] = useState(false);

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

      {stage.type !== "linkContest" && (
        <Button
          style="blue-secondary"
          size="sm"
          onClick={() => setModal(<LoadoutManagerModal />)}
        >
          <FaFloppyDisk />
          <span className={styles.buttonText}>{t("manageLoadouts")}</span>
        </Button>
      )}

      <Button
        style="blue-secondary"
        size="sm"
        disabled={!loadoutHistory.length}
        onClick={() => setModal(<HistoryModal />)}
      >
        <FaClockRotateLeft />
        <span className={styles.buttonText}>{t("history")}</span>
      </Button>

      {!!simulatorUrl && (
        <>
          <Button
            style="blue-secondary"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(simulatorUrl);
              setLinkCopied(true);
              setTimeout(() => setLinkCopied(false), 3000);
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
