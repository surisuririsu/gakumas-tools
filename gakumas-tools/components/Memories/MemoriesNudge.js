import { memo, useContext } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { FaPen } from "react-icons/fa6";
import Button from "@/components/Button";
import MemoryEditorModal from "@/components/MemoryEditorModal";
import MemoryImporterModal from "@/components/MemoryImporterModal";
import DataContext from "@/contexts/DataContext";
import ModalContext from "@/contexts/ModalContext";
import styles from "./Memories.module.scss";

function MemoriesNudge() {
  const t = useTranslations("MemoriesNudge");

  const { status } = useSession();
  const { uploadMemories, memoriesLoading } = useContext(DataContext);
  const { setModal } = useContext(ModalContext);

  return (
    <div className={styles.nudge}>
      {status == "unauthenticated" && (
        <Button style="primary" onClick={() => setModal(<MemoryEditorModal />)}>
          <FaPen /> {t("create")}
        </Button>
      )}
      {status == "authenticated" && !memoriesLoading && (
        <Button
          style="primary"
          onClick={() =>
            setModal(<MemoryImporterModal onSuccess={uploadMemories} />)
          }
        >
          {t("import")}
        </Button>
      )}
    </div>
  );
}

export default memo(MemoriesNudge);
