"use client";
import {
  createContext,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

const ModalContext = createContext();

export const ModalLayerContext = createContext(null);

export function ModalContextProvider({ children }) {
  const [modals, _setModals] = useState([]);
  const nextIdRef = useRef(0);
  const modalsRef = useRef(modals);
  modalsRef.current = modals;

  const closeModal = useCallback(() => {
    _setModals((cur) => {
      const index = cur.findLastIndex((modal) => !modal.closing);
      if (index == -1) return cur;
      return cur.map((modal, i) =>
        i == index ? { ...modal, closing: true } : modal
      );
    });
  }, []);

  const setModal = useCallback((element) => {
    const id = nextIdRef.current++;
    const returnFocus = document.activeElement;
    _setModals((cur) => cur.concat({ id, element, returnFocus }));
  }, []);

  const removeModal = useCallback((id) => {
    const modal = modalsRef.current.find((m) => m.id == id);
    if (!modal) return;
    _setModals((cur) => cur.filter((m) => m.id != id));
    if (modal.returnFocus?.isConnected) modal.returnFocus.focus();
  }, []);

  const getModalStackDepth = useCallback(
    () => modalsRef.current.filter((modal) => !modal.closing).length,
    []
  );

  const value = useMemo(
    () => ({ setModal, closeModal, getModalStackDepth }),
    [setModal, closeModal, getModalStackDepth]
  );

  const liveIndices = modals.flatMap((modal, i) => (modal.closing ? [] : i));

  return (
    <ModalContext.Provider value={value}>
      {children}
      {modals.map((modal, i) => (
        <ModalLayer
          key={modal.id}
          id={modal.id}
          closing={!!modal.closing}
          covered={liveIndices.some((j) => j > i)}
          stacked={liveIndices.some((j) => j < i)}
          onExited={removeModal}
        >
          {modal.element}
        </ModalLayer>
      ))}
    </ModalContext.Provider>
  );
}

function ModalLayer({ id, closing, covered, stacked, onExited, children }) {
  const value = useMemo(
    () => ({ closing, covered, stacked, onExited: () => onExited(id) }),
    [id, closing, covered, stacked, onExited]
  );

  return (
    <ModalLayerContext.Provider value={value}>
      {children}
    </ModalLayerContext.Provider>
  );
}

export default ModalContext;
