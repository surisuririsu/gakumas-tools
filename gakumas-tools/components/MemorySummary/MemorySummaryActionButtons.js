import { memo, useContext } from "react";
import { useTranslations } from "next-intl";
import { FaArrowRight, FaPen, FaTrophy } from "react-icons/fa6";
import MemoryEditorModal from "@/components/MemoryEditorModal";
import { LoadoutActionsContext } from "@/contexts/LoadoutContext";
import MemoryContext from "@/contexts/MemoryContext";
import ModalContext from "@/contexts/ModalContext";
import { useRouter } from "@/i18n/routing";
import styles from "./MemorySummary.module.scss";

function MemorySummaryActionButtons({ memory }) {
  const t = useTranslations("MemorySummaryActionButtons");

  const router = useRouter();
  const { setMemory } = useContext(LoadoutActionsContext);
  const { setAll } = useContext(MemoryContext);
  const { setModal } = useContext(ModalContext);

  function editMemory() {
    setAll(memory);
    setModal(<MemoryEditorModal />);
  }

  function loadMemory(index) {
    setMemory(memory, index);
    router.push("/simulator");
  }

  return (
    <div className={styles.actions}>
      <button
        type="button"
        className={styles.action}
        style={{ "--i": 0 }}
        onClick={editMemory}
      >
        <FaPen aria-hidden="true" />
        {t("edit")}
      </button>
      {[0, 1].map((index) => (
        <button
          key={index}
          type="button"
          className={styles.action}
          style={{ "--i": index + 1 }}
          onClick={() => loadMemory(index)}
        >
          <FaTrophy aria-hidden="true" className={styles.trophy} />
          {index + 1}
          <FaArrowRight aria-hidden="true" className={styles.arrow} />
        </button>
      ))}
    </div>
  );
}

export default memo(MemorySummaryActionButtons);
