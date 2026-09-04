"use client";
import { createContext, useCallback, useMemo, useRef, useState } from "react";

const ModalContext = createContext();

export function ModalContextProvider({ children }) {
  const [modals, _setModals] = useState([]);
  const originalFocusRef = useRef(null);
  // Mirrors `modals` so the depth getter can stay referentially stable while
  // still reading the current stack at call time (Modal calls it from a
  // keydown handler).
  const modalsRef = useRef(modals);
  modalsRef.current = modals;

  const closeModal = useCallback(() => {
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
  }, []);

  const setModal = useCallback((modal) => {
    _setModals((cur) => {
      // Store the original focused element when opening the first modal
      if (cur.length === 0) {
        originalFocusRef.current = document.activeElement;
      }
      return cur.concat(modal);
    });
  }, []);

  const getModalStackDepth = useCallback(() => modalsRef.current.length, []);

  const value = useMemo(
    () => ({ setModal, closeModal, getModalStackDepth }),
    [setModal, closeModal, getModalStackDepth]
  );

  return (
    <ModalContext.Provider value={value}>
      <>
        {children}
        {!!modals.length && modals[modals.length - 1]}
      </>
    </ModalContext.Provider>
  );
}

export default ModalContext;
