import { memo, useContext } from "react";
import EntityBank from "@/components/EntityBank";
import Modal from "@/components/Modal";
import ModalContext from "@/contexts/ModalContext";

function EntityPickerModal({ type, onPick, filters }) {
  const { closeModal } = useContext(ModalContext);

  return (
    <Modal>
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
