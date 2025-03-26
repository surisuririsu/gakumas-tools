"use client";
import { memo, useContext, useState } from "react";
import { useTranslations } from "next-intl";
import { FaCheck, FaRegCopy } from "react-icons/fa6";
import Button from "@/components/Button";
import ConfirmModal from "@/components/ConfirmModal";
import LoadoutManagerModal from "@/components/LoadoutManagerModal";
import LoadoutContext from "@/contexts/LoadoutContext";
import ModalContext from "@/contexts/ModalContext";
import styles from "./Simulator.module.scss";

function SimulatorButtons() {
  const t = useTranslations("SimulatorButtons");

  const { clear, simulatorUrl } = useContext(LoadoutContext);
  const { setModal } = useContext(ModalContext);
  const [linkCopied, setLinkCopied] = useState(false);

  return (
    <div className={styles.buttons}>
      <Button
        style="red-secondary"
        onClick={() =>
          setModal(<ConfirmModal message={t("confirm")} onConfirm={clear} />)
        }
      >
        {t("clear")}
      </Button>

      <Button
        style="blue-secondary"
        onClick={() => setModal(<LoadoutManagerModal />)}
      >
        {t("manageLoadouts")}
      </Button>

      <Button
        style="blue-secondary"
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
