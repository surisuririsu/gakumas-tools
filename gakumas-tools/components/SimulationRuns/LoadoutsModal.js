"use client";
import { useContext } from "react";
import Modal from "@/components/Modal";
import ModalContext from "@/contexts/ModalContext";
import CompareTab from "./CompareTab";

export default function LoadoutsModal() {
  const { closeModal } = useContext(ModalContext);
  return (
    <Modal>
      <CompareTab currentRun={null} onAfterLoad={closeModal} />
    </Modal>
  );
}
