import { memo, useContext, useEffect, useRef } from "react";
import { FaXmark } from "react-icons/fa6";
import ModalContext from "@/contexts/ModalContext";
import styles from "./Modal.module.scss";

function Modal({ children, dismissable = true, onClose }) {
  const { closeModal: contextClose, getModalStackDepth } =
    useContext(ModalContext);
  const close = onClose || contextClose;
  // When `onClose` is provided, the modal is rendered inline by a parent
  // rather than pushed onto the global stack. If a stacked modal is currently
  // on top, defer ESC to it instead of closing ourselves alongside it.
  const isInline = !!onClose;
  const modalRef = useRef(null);
  const mouseDownOnOverlayRef = useRef(false);

  useEffect(() => {
    if (!modalRef.current) return;
    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    } else {
      modalRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && dismissable) {
        if (isInline && getModalStackDepth() > 0) return;
        e.preventDefault();
        close();
        return;
      }

      if (e.key !== "Tab" || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [dismissable, close, isInline, getModalStackDepth]);

  const handleOverlayMouseDown = (e) => {
    mouseDownOnOverlayRef.current = e.target === e.currentTarget;
  };

  const handleOverlayMouseUp = (e) => {
    // Only dismiss when both the press and the release land on the overlay
    // itself. A drag that crosses the overlay/modal boundary in either
    // direction fires `click` on the nearest common ancestor (the overlay),
    // which would otherwise look indistinguishable from a real outside click.
    const dismiss =
      dismissable &&
      mouseDownOnOverlayRef.current &&
      e.target === e.currentTarget;
    mouseDownOnOverlayRef.current = false;
    if (dismiss) close();
  };

  return (
    <div
      className={styles.overlay}
      onMouseDown={handleOverlayMouseDown}
      onMouseUp={handleOverlayMouseUp}
    >
      <div 
        ref={modalRef}
        className={styles.modal} 
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {dismissable && (
          <button className={styles.close} onClick={close}>
            <FaXmark />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

export default memo(Modal);
