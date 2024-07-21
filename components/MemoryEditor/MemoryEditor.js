import { useState } from "react";
import ParametersInput from "@/components/ParametersInput";
import PIdolSelect from "@/components/PIdolSelect";
import styles from "./MemoryEditor.module.scss";

export default function MemoryEditor() {
  const [pIdol, setPIdol] = useState(null);
  const [params, setParams] = useState([null, null, null]);
  return (
    <div className={styles.memoryEditor}>
      <label>P-idol</label>
      <PIdolSelect selected={pIdol} onChange={setPIdol} />
      <label>Parameters</label>
      <div className={styles.params}>
        <ParametersInput parameters={params} onChange={setParams} />
      </div>
      <label>P-items</label>
      <label>Skill cards</label>
    </div>
  );
}
