"use client";
import { createContext, useState } from "react";

const ModalContext = createContext();

export function ModalContextProvider({ children }) {
  const [modal, setModal] = useState(null);

  function closeModal() {
    setModal(null);
  }

  return (
    <ModalContext.Provider value={{ setModal, closeModal }}>
      <>
        {children}
        {modal}
      </>
    </ModalContext.Provider>
  );
}

export default ModalContext;
