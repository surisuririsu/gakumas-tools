import { FaXmark } from "react-icons/fa6";
import IconButton from "@/components/IconButton";
import styles from "./Modal.module.scss";

export default function Modal({ children, onClose }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.close}>
          <IconButton icon={FaXmark} onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
}
