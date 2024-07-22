import { useContext } from "react";
import ParametersInput from "@/components/ParametersInput";
import PIdolSelect from "@/components/PIdolSelect";
import StagePItems from "@/components/StagePItems";
import StageSkillCards from "@/components/StageSkillCards";
import Trash from "@/components/Trash";
import MemoryContext from "@/contexts/MemoryContext";
import SelectionContext from "@/contexts/SelectionContext";
import styles from "./MemoryEditor.module.scss";

export default function MemoryEditor() {
  const { pIdolId, setPIdolId, params, setParams, pItemIds, skillCardIds } =
    useContext(MemoryContext);
  const { setSelectedEntity } = useContext(SelectionContext);
  return (
    <div
      className={styles.memoryEditor}
      onClick={() => setSelectedEntity(null)}
    >
      <label>P-idol</label>
      <PIdolSelect selected={pIdolId} onChange={setPIdolId} />
      <label>Parameters</label>
      <div className={styles.params}>
        <ParametersInput parameters={params} onChange={setParams} />
      </div>
      <label>P-items</label>
      <StagePItems pItemIds={pItemIds} />
      <label>Skill cards</label>
      <StageSkillCards skillCardIds={skillCardIds} />
      <Trash />
    </div>
  );
}
