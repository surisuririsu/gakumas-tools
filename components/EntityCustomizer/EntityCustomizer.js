import { memo, useContext } from "react";
import { useTranslations } from "next-intl";
import { FaPlus } from "react-icons/fa6";
import { Customizations } from "gakumas-data/lite";
import CustomizationModal from "@/components/CustomizationModal";
import EntityIcon from "@/components/EntityIcon";
import ModalContext from "@/contexts/ModalContext";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import styles from "./EntityCustomizer.module.scss";

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
          customizations={customizations}
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
            <CustomizationModal
              customizations={customizations}
              onCustomize={onCustomize}
              id={id}
            />
          )
        }
      >
        <FaPlus />
      </button>
    </div>
  );
}

export default memo(EntityCustomizer);
