import { memo, useContext } from "react";
import EntityBank from "@/components/EntityBank";
import EntityCustomizer from "@/components/EntityCustomizer";
import Modal from "@/components/Modal";
import ModalContext from "@/contexts/ModalContext";

function EntityPickerModal({
  type,
  id,
  customizations,
  onPick,
  onCustomize,
  filters,
}) {
  const { closeModal } = useContext(ModalContext);

  return (
    <Modal>
      {!!id && customizations != null && (
        <EntityCustomizer
          type={type}
          id={id}
          customizations={customizations}
          onCustomize={(customs) => {
            onCustomize(customs);
            closeModal();
          }}
        />
      )}
      <EntityBank
        type={type}
        onClick={(entity) => {
          onPick(entity);
          closeModal();
        }}
        filters={filters}
      />
    </Modal>
  );
}

export default memo(EntityPickerModal);
