"use client";
import { useContext } from "react";
import Modal from "@/components/Modal";
import ModalContext from "@/contexts/ModalContext";
import CompareTab from "./CompareTab";
import styles from "./SimulationRuns.module.scss";

export default function LoadoutsModal() {
  const { closeModal } = useContext(ModalContext);
  return (
    <Modal>
      <div className={styles.modalScroll}>
        <CompareTab currentRun={null} onAfterLoad={closeModal} />
      </div>
    </Modal>
  );
}
