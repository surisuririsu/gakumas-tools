import { useContext } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import ModalContext from "@/contexts/ModalContext";
import styles from "./ConfirmModal.module.scss";

export default function ConfirmModal({ message, onConfirm, onCancel }) {
  const t = useTranslations("ConfirmModal");

  const { closeModal } = useContext(ModalContext);

  const confirm = () => {
    if (onConfirm) onConfirm();
    closeModal();
  };

  const cancel = () => {
    if (onCancel) onCancel();
    closeModal();
  };

  return (
    <Modal>
      <p>{message}</p>
      <div className={styles.buttons}>
        <Button style="secondary" fill onClick={cancel}>
          {t("cancel")}
        </Button>
        <Button style="primary" fill onClick={confirm}>
          {t("ok")}
        </Button>
      </div>
    </Modal>
  );
}
