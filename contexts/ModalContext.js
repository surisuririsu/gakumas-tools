"use client";
import { createContext, useState } from "react";

const ModalContext = createContext();

export function ModalContextProvider({ children }) {
  const [modals, _setModals] = useState([]);

  function closeModal() {
    _setModals((cur) => cur.slice(0, cur.length - 1));
  }

  function setModal(modal) {
    _setModals(modals.concat(modal));
  }

  return (
    <ModalContext.Provider value={{ setModal, closeModal }}>
      <>
        {children}
        {!!modals.length && modals[modals.length - 1]}
      </>
    </ModalContext.Provider>
  );
}

export default ModalContext;
