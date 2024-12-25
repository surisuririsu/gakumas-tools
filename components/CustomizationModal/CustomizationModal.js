import { memo, useContext, useState } from "react";
import { useTranslations } from "next-intl";
import { FaCheck, FaPlus, FaMinus } from "react-icons/fa6";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import ModalContext from "@/contexts/ModalContext";
import Customizations from "@/customizations/customizations";
import c from "@/utils/classNames";
import { CUSTOMIZATIONS } from "@/utils/customizations";
import styles from "./CustomizationModal.module.scss";
import IconButton from "../IconButton";

function CustomizationModal({ id, customizations, onCustomize }) {
  const t = useTranslations("CustomizationModal");
  const { closeModal } = useContext(ModalContext);
  const [current, setCurrent] = useState(customizations);
  const availableC11ns = Customizations.getBySkillCardId(id);

  return (
    <Modal>
      <div className={styles.c11ns}>
        {availableC11ns.map((c11n) => (
          <div key={c11n.id} className={c(styles.c11n)}>
            <div className={styles.level}>{current[c11n.id] || 0}</div>
            <IconButton
              icon={FaPlus}
              disabled={current[c11n.id] >= c11n.limit}
              onClick={() =>
                setCurrent({
                  ...current,
                  [c11n.id]: (current[c11n.id] || 0) + 1,
                })
              }
            />
            <div>{c11n.name}</div>
            <IconButton
              icon={FaMinus}
              disabled={(current[c11n.id] || 0) <= 0}
              onClick={() =>
                setCurrent({
                  ...current,
                  [c11n.id]: (current[c11n.id] || 1) - 1,
                })
              }
            />
          </div>
        ))}
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

export default memo(CustomizationModal);
