"use client";
import { memo, useContext, useState } from "react";
import { useTranslations } from "next-intl";
import { FaCheck, FaRegCopy, FaArrowUpRightFromSquare } from "react-icons/fa6";
import Button from "@/components/Button";
import LoadoutContext from "@/contexts/LoadoutContext";
import ModalContext from "@/contexts/ModalContext";
import styles from "./Simulator.module.scss";
import ConfirmModal from "../ConfirmModal";

function SimulatorButtons() {
  const t = useTranslations("SimulatorButtons");

  const { clear, simulatorUrl, kafeUrl } = useContext(LoadoutContext);
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

      {kafeUrl && (
        <Button style="blue-secondary" href={kafeUrl} target="_blank" fill>
          @かふぇもっと <FaArrowUpRightFromSquare />
        </Button>
      )}
    </div>
  );
}

export default memo(SimulatorButtons);
