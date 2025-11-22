import { memo, useContext } from "react";
import { FaXmark } from "react-icons/fa6";
import ModalContext from "@/contexts/ModalContext";
import styles from "./Modal.module.scss";

function Modal({ children, dismissable = true }) {
  const { closeModal } = useContext(ModalContext);

  const handleOverlayClick = () => {
    if (dismissable) {
      closeModal();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
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
