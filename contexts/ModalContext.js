"use client";
import EntityBank from "@/components/EntityBank";
import Modal from "@/components/Modal";
import { EntityTypes } from "@/utils/entities";
import { createContext, useState } from "react";

const ModalContext = createContext();

export function ModalContextProvider({ children }) {
  const [modal, setModal] = useState(null);

  function pickEntityModal(type, callback, filters) {
    setModal(
      <Modal>
        <EntityBank
          type={type}
          onClick={(entity) => {
            callback(entity);
            setModal(null);
          }}
          filters={filters}
        />
      </Modal>
    );
  }

  function pickSkillCardModal(callback, filters) {
    pickEntityModal(EntityTypes.SKILL_CARD, callback, filters);
  }

  function pickPItemModal(callback, filters) {
    pickEntityModal(EntityTypes.P_ITEM, callback, filters);
  }

  function closeModal() {
    setModal(null);
  }

  return (
    <ModalContext.Provider
      value={{ setModal, closeModal, pickSkillCardModal, pickPItemModal }}
    >
      <>
        {children}
        {modal}
      </>
    </ModalContext.Provider>
  );
}

export default ModalContext;
