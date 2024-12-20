import { memo, useContext, useState } from "react";
import { useTranslations } from "next-intl";
import { FaCheck } from "react-icons/fa6";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import ModalContext from "@/contexts/ModalContext";
import c from "@/utils/classNames";
import { CUSTOMIZATIONS } from "@/utils/customizations";
import styles from "./CustomizationMultiPickerModal.module.scss";

function CustomizationMultiPickerModal({ customizations, onCustomize }) {
  const t = useTranslations("CustomizationMultiPickerModal");
  const { closeModal } = useContext(ModalContext);
  const [current, setCurrent] = useState(customizations);

  return (
    <Modal>
      <div className={styles.list}>
        {CUSTOMIZATIONS.map(({ id, label }) => {
          const selected = current.includes(id);
          return (
            <button
              key={id}
              className={c(selected && styles.selected)}
              onClick={() =>
                setCurrent(
                  selected ? current.filter((x) => x != id) : [...current, id]
                )
              }
            >
              <span>{label}</span> {selected && <FaCheck />}
            </button>
          );
        })}
      </div>
      <Button
        style="primary"
        onClick={() => {
          onCustomize(current);
          closeModal();
        }}
      >
        {t("apply")}
      </Button>
    </Modal>
  );
}

export default memo(CustomizationMultiPickerModal);
