import { useContext, useState } from "react";
import ParametersInput from "@/components/ParametersInput";
import PIdolSelect from "@/components/PIdolSelect";
import StagePItems from "@/components/StagePItems";
import StageSkillCards from "@/components/StageSkillCards";
import MemoryContext from "@/contexts/MemoryContext";
import styles from "./MemoryEditor.module.scss";

export default function MemoryEditor() {
  const { pIdolId, setPIdolId } = useContext(MemoryContext);
  const [params, setParams] = useState([null, null, null]);
  const [pItemIds, setPItemIds] = useState([0, 0, 20, 0]);
  const [skillCardIds, setSkillCardIds] = useState([0, 0, 20, 0, 0, 0]);
  return (
    <div className={styles.memoryEditor}>
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
    </div>
  );
}
