"use client";
import { createContext, useState, useRef } from "react";

const ModalContext = createContext();

export function ModalContextProvider({ children }) {
  const [modals, _setModals] = useState([]);
  const originalFocusRef = useRef(null);

  function closeModal() {
    _setModals((cur) => {
      const newModals = cur.slice(0, cur.length - 1);
      // If closing the last modal, we'll need to restore focus
      if (newModals.length === 0 && originalFocusRef.current) {
        // Use setTimeout to ensure the modal is unmounted first
        setTimeout(() => {
          if (originalFocusRef.current && originalFocusRef.current.focus) {
            originalFocusRef.current.focus();
          }
          originalFocusRef.current = null;
        }, 0);
      }
      return newModals;
    });
  }

  function setModal(modal) {
    // Store the original focused element when opening the first modal
    if (modals.length === 0) {
      originalFocusRef.current = document.activeElement;
    }
    _setModals(modals.concat(modal));
  }

  const getModalStackDepth = () => modals.length;

  return (
    <ModalContext.Provider value={{ setModal, closeModal, getModalStackDepth }}>
      <>
        {children}
        {!!modals.length && modals[modals.length - 1]}
      </>
    </ModalContext.Provider>
  );
}

export default ModalContext;
