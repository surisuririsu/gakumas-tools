import { memo, useContext, useState } from "react";
import { useTranslations } from "next-intl";
import { FaPlus, FaMinus } from "react-icons/fa6";
import { SkillCards } from "gakumas-data/lite";
import Button from "@/components/Button";
import IconButton from "@/components/IconButton";
import Modal from "@/components/Modal";
import ModalContext from "@/contexts/ModalContext";
import Customizations from "@/customizations/customizations";
import c from "@/utils/classNames";
import styles from "./CustomizationModal.module.scss";

function CustomizationModal({ id, customizations, onCustomize }) {
  const t = useTranslations("CustomizationModal");
  const { closeModal } = useContext(ModalContext);
  const [current, setCurrent] = useState(customizations);
  const availableC11nIds =
    SkillCards.getById(id)?.availableCustomizations || [];
  const availableC11ns = availableC11nIds
    .map(Customizations.getById)
    .filter((x) => x);

  return (
    <Modal>
      <div className={styles.c11ns}>
        {availableC11ns.map((c11n) => (
          <div key={c11n.id} className={c(styles.c11n, styles[c11n.type])}>
            <div className={styles.level}>{current[c11n.id] || 0}</div>
            <IconButton
              icon={FaPlus}
              disabled={current[c11n.id] >= c11n.max}
              onClick={() =>
                setCurrent({
                  ...current,
                  [c11n.id]: (current[c11n.id] || 0) + 1,
                })
              }
            />
            {c11n.name}
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
}

export default memo(CustomizationModal);
