import { memo, useContext, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  FaCircleXmark,
  FaFileImport,
  FaFilm,
  FaMagnifyingGlass,
  FaPen,
  FaRegTrashCan,
} from "react-icons/fa6";
import Button from "@/components/Button";
import IconButton from "@/components/IconButton";
import MemoryEditorModal from "@/components/MemoryEditorModal";
import MemoryImporterModal from "@/components/MemoryImporterModal";
import StagePItems from "@/components/StagePItems";
import StageSkillCards from "@/components/StageSkillCards";
import DataContext from "@/contexts/DataContext";
import MemoryContext from "@/contexts/MemoryContext";
import ModalContext from "@/contexts/ModalContext";
import SearchContext from "@/contexts/SearchContext";
import styles from "./Memories.module.scss";

function MemoriesHeader({
  numMemories,
  action,
  setAction,
  selectedMemories,
  setSelectedMemories,
}) {
  const t = useTranslations("MemoriesHeader");

  const { status } = useSession();
  const { uploadMemories, deleteMemories, memoriesLoading } =
    useContext(DataContext);
  const { setAll } = useContext(MemoryContext);
  const { setModal } = useContext(ModalContext);
  const { pItemIds, skillCardIds, replacePItemId, replaceSkillCardId } =
    useContext(SearchContext);

  const selectedMemoryIds = useMemo(
    () => Object.keys(selectedMemories).filter((s) => selectedMemories[s]),
    [selectedMemories]
  );

  return (
    <div className={styles.header}>
      {action ? (
        <IconButton icon={FaCircleXmark} onClick={() => setAction(null)} />
      ) : (
        <>
          <IconButton
            icon={FaMagnifyingGlass}
            onClick={() => setAction("search")}
          />
          <IconButton
            icon={FaPen}
            onClick={() => {
              setAll({});
              setModal(<MemoryEditorModal />);
            }}
          />
          {status == "authenticated" && (
            <IconButton
              icon={FaFileImport}
              onClick={() =>
                setModal(<MemoryImporterModal onSuccess={uploadMemories} />)
              }
            />
          )}
          <IconButton
            icon={FaRegTrashCan}
            onClick={() => setAction("delete")}
          />
          <div className={styles.fill} />
          {!memoriesLoading && (
            <div className={styles.count}>
              <FaFilm />
              {numMemories}
            </div>
          )}
        </>
      )}

      {action == "search" && (
        <div className={styles.search}>
          <StagePItems
            pItemIds={pItemIds}
            replacePItemId={replacePItemId}
            size="small"
          />
          <StageSkillCards
            skillCardIds={skillCardIds}
            replaceSkillCardId={replaceSkillCardId}
            size="medium"
          />
        </div>
      )}

      {action == "delete" && (
        <div className={styles.delete}>
          {t("selected", { num: selectedMemoryIds.length })}{" "}
          <Button
            style="red"
            onClick={() => {
              deleteMemories(selectedMemoryIds);
              setSelectedMemories({});
            }}
            disabled={!selectedMemoryIds.length}
          >
            {t("delete")}
          </Button>
        </div>
      )}
    </div>
  );
}

export default memo(MemoriesHeader);
