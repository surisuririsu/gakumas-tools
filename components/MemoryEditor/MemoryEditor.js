import { useContext } from "react";
import Input from "@/components/Input";
import ParametersInput from "@/components/ParametersInput";
import PIdolSelect from "@/components/PIdolSelect";
import SaveButton from "@/components/SaveButton";
import StagePItems from "@/components/StagePItems";
import StageSkillCards from "@/components/StageSkillCards";
import Trash from "@/components/Trash";
import MemoryContext from "@/contexts/MemoryContext";
import SelectionContext from "@/contexts/SelectionContext";
import styles from "./MemoryEditor.module.scss";

export default function MemoryEditor() {
  const {
    name,
    setName,
    pIdolId,
    setPIdolId,
    params,
    setParams,
    pItemIds,
    skillCardIds,
  } = useContext(MemoryContext);
  const { setSelectedEntity } = useContext(SelectionContext);
  return (
    <div
      className={styles.memoryEditor}
      onClick={() => setSelectedEntity(null)}
    >
      <label>Name</label>
      <div className={styles.name}>
        <Input placeholder="Name" value={name} onChange={setName} />
      </div>
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
      <div className={styles.save}>
        <SaveButton />
      </div>
      <Trash />
    </div>
  );
}
