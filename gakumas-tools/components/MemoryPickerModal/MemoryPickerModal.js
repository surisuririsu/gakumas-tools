import { memo, useContext, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { PIdols } from "gakumas-data";
import MemoriesList from "@/components/Memories/MemoriesList";
import Modal from "@/components/Modal";
import PlanIdolSelects from "@/components/PlanIdolSelects";
import DataContext from "@/contexts/DataContext";
import LoadoutContext from "@/contexts/LoadoutContext";
import ModalContext from "@/contexts/ModalContext";
import { calculateContestPower } from "@/utils/contestPower";
import { compareUnfilteredMemories } from "@/utils/sort";
import styles from "./MemoryPickerModal.module.scss";

function MemoryPickerModal({ index }) {
  const { status } = useSession();
  const { memories, fetchMemories } = useContext(DataContext);
  const { stage, setMemory } = useContext(LoadoutContext);
  const { closeModal } = useContext(ModalContext);
  const [plan, setPlan] = useState(stage.plan == "free" ? null : stage.plan);
  const [idolId, setIdolId] = useState(null);

  useEffect(() => {
    if (status == "authenticated" && !memories.length) {
      fetchMemories();
    }
  }, [status]);

  const filteredMemories = useMemo(
    () =>
      memories
        .filter((memory) => {
          const pIdol = PIdols.getById(memory.pIdolId);
          if (plan && plan != pIdol?.plan) return false;
          if (idolId && idolId != pIdol?.idolId) return false;
          return true;
        })
        .map((memory) => {
          memory.contestPower = calculateContestPower(
            memory.params,
            memory.pItemIds,
            memory.skillCardIds,
            memory.customizations
          );
          return memory;
        })
        .sort(compareUnfilteredMemories),
    [memories, plan, idolId]
  );

  return (
    <Modal>
      <div className={styles.memoryPicker}>
        <MemoriesList
          memories={filteredMemories}
          picking
          onPick={(memory) => {
            setMemory(memory, index);
            closeModal();
          }}
        />
      </div>
      <PlanIdolSelects
        plan={plan}
        idolId={idolId}
        setPlan={setPlan}
        setIdolId={setIdolId}
        includeAll
      />
    </Modal>
  );
}

export default memo(MemoryPickerModal);
