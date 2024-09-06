import { memo, useContext } from "react";
import { useTranslations } from "next-intl";
import { FaTrophy, FaArrowRight } from "react-icons/fa6";
import Button from "@/components/Button";
import MemoryEditorModal from "@/components/MemoryEditorModal";
import LoadoutContext from "@/contexts/LoadoutContext";
import MemoryContext from "@/contexts/MemoryContext";
import ModalContext from "@/contexts/ModalContext";
import { useRouter } from "@/i18n/routing";
import styles from "./MemorySummary.module.scss";

function MemorySummaryActionButtons({ memory }) {
  const t = useTranslations("MemorySummaryActionButtons");

  const router = useRouter();
  const { setMemory } = useContext(LoadoutContext);
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
      <Button onClick={editMemory}>{t("edit")}</Button>
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
