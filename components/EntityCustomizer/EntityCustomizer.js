import { memo, useContext } from "react";
import { useTranslations } from "next-intl";
import { FaCirclePlus } from "react-icons/fa6";
import CustomizationMultiPickerModal from "@/components/CustomizationMultiPickerModal";
import EntityIcon from "@/components/EntityIcon";
import ModalContext from "@/contexts/ModalContext";
import { CUSTOMIZATIONS_BY_ID } from "@/utils/customizations";
import styles from "./EntityCustomizer.module.scss";

function EntityCustomizer({ type, id, customizations, onCustomize }) {
  const t = useTranslations("EntityCustomizer");
  const { setModal } = useContext(ModalContext);

  return (
    <div className={styles.entityCustomizer}>
      <div className={styles.label}>{t("customization")}</div>
      <div className={styles.icon}>
        <EntityIcon
          type={type}
          id={id}
          numCustomizations={customizations.length}
          size="fill"
        />
      </div>
      <div className={styles.customizations}>
        {customizations.map((custom) => (
          <div key={custom}>{CUSTOMIZATIONS_BY_ID[custom].label}</div>
        ))}
      </div>
      <button
        className={styles.add}
        onClick={() =>
          setModal(
            <CustomizationMultiPickerModal
              customizations={customizations}
              onCustomize={onCustomize}
            />
          )
        }
      >
        <FaCirclePlus />
      </button>
    </div>
  );
}

export default memo(EntityCustomizer);
