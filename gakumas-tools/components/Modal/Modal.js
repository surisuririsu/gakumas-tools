import { memo, useContext, useEffect, useRef } from "react";
import { FaXmark } from "react-icons/fa6";
import ModalContext from "@/contexts/ModalContext";
import styles from "./Modal.module.scss";

function Modal({ children, dismissable = true }) {
  const { closeModal } = useContext(ModalContext);
  const modalRef = useRef(null);

  useEffect(() => {
    // Focus the modal container or first focusable element
    if (modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      } else {
        // If no focusable elements, focus the modal itself
        modalRef.current.focus();
      }
    }

    // Handle tab key to trap focus within modal
    const handleKeyDown = (e) => {
      if (e.key !== "Tab" || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleOverlayClick = () => {
    if (dismissable) {
      closeModal();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div 
        ref={modalRef}
        className={styles.modal} 
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {dismissable && (
          <button className={styles.close} onClick={closeModal}>
            <FaXmark />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

export default memo(Modal);
