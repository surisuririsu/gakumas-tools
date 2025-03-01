import { memo, useContext } from "react";
import { SkillCards } from "gakumas-data";
import EntityBank from "@/components/EntityBank";
import EntityCustomizer from "@/components/EntityCustomizer";
import Modal from "@/components/Modal";
import ModalContext from "@/contexts/ModalContext";
import { EntityTypes } from "@/utils/entities";

function EntityPickerModal({
  type,
  id,
  customizations,
  onPick,
  onCustomize,
  filters,
}) {
  const { closeModal } = useContext(ModalContext);
  const canCustomize =
    type == EntityTypes.SKILL_CARD &&
    !!SkillCards.getById(id)?.availableCustomizations?.length;

  return (
    <Modal>
      {canCustomize && onCustomize && (
        <EntityCustomizer
          type={type}
          id={id}
          customizations={customizations}
          onCustomize={onCustomize}
        />
      )}
      <EntityBank
        type={type}
        onClick={(entity) => {
          if (!id || entity.id != id) {
            onCustomize && onCustomize({});
          }
          onPick(entity);
          closeModal();
        }}
        filters={filters}
      />
    </Modal>
  );
}

export default memo(EntityPickerModal);
