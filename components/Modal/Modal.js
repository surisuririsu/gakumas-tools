import { useContext } from "react";
import { FaXmark } from "react-icons/fa6";
import IconButton from "@/components/IconButton";
import ModalContext from "@/contexts/ModalContext";
import styles from "./Modal.module.scss";

export default function Modal({ children }) {
  const { closeModal } = useContext(ModalContext);

  return (
    <div className={styles.overlay} onClick={closeModal}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.close}>
          <IconButton icon={FaXmark} onClick={closeModal} />
        </div>
        {children}
      </div>
    </div>
  );
}
