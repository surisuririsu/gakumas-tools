import Loader from "@/components/Loader";
import Modal from "./Modal";
import styles from "./Modal.module.scss";

export default function ModalLoading() {
  return (
    <Modal>
      <div className={styles.loading} aria-busy="true">
        <Loader size="large" />
      </div>
    </Modal>
  );
}
