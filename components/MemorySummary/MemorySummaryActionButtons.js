import { memo, useContext } from "react";
import { useRouter } from "next/navigation";
import { FaTrophy, FaArrowRight } from "react-icons/fa6";
import Button from "@/components/Button";
import LoadoutContext from "@/contexts/LoadoutContext";
import MemoryContext from "@/contexts/MemoryContext";
import styles from "./MemorySummary.module.scss";

function MemorySummaryActionButtons({ memory }) {
  const router = useRouter();
  const { setMemory } = useContext(LoadoutContext);
  const { setAll } = useContext(MemoryContext);

  function editMemory() {
    setAll(memory);
    router.push("/memory-editor");
  }

  function loadMemory(index) {
    setMemory(memory, index);
    router.push("/simulator");
  }

  return (
    <div className={styles.actions}>
      <Button onClick={editMemory}>Edit</Button>
      <Button onClick={() => loadMemory(0)}>
        <FaTrophy />
        1
        <FaArrowRight />
      </Button>
      <Button onClick={() => loadMemory(1)}>
        <FaTrophy />
        2
        <FaArrowRight />
      </Button>
    </div>
  );
}

export default memo(MemorySummaryActionButtons);
