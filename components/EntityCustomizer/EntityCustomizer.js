import { memo, useContext } from "react";
import { useTranslations } from "next-intl";
import { FaCirclePlus } from "react-icons/fa6";
import CustomizationMultiPickerModal from "@/components/CustomizationModal";
import EntityIcon from "@/components/EntityIcon";
import ModalContext from "@/contexts/ModalContext";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import {
  countCustomizations,
  CUSTOMIZATIONS_BY_ID,
} from "@/utils/customizations";
import styles from "./EntityCustomizer.module.scss";
import Customizations from "@/customizations/customizations";

function EntityCustomizer({ type, id, customizations = {}, onCustomize }) {
  const t = useTranslations("EntityCustomizer");
  const { setModal } = useContext(ModalContext);
  const { idolId } = useContext(WorkspaceContext);

  return (
    <div className={styles.entityCustomizer}>
      <div className={styles.label}>{t("customization")}</div>
      <div className={styles.icon}>
        <EntityIcon
          type={type}
          id={id}
          idolId={idolId}
          numCustomizations={countCustomizations(customizations)}
          size="fill"
        />
      </div>
      <div className={styles.customizations}>
        {Object.keys(customizations)
          .filter((c11nId) => customizations[c11nId])
          .map((c11nId) => (
            <div key={c11nId}>
              {customizations[c11nId]}×{Customizations.getById(c11nId).name}
            </div>
          ))}
      </div>
      <button
        className={styles.add}
        onClick={() =>
          setModal(
            <CustomizationMultiPickerModal
              customizations={customizations}
              onCustomize={onCustomize}
              id={id}
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
