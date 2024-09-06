import { memo, useContext, useState } from "react";
import { useTranslations } from "next-intl";
import {
  serializeEffectSequence,
  deserializeEffectSequence,
} from "gakumas-data";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import ParametersInput from "@/components/ParametersInput";
import ParametersMultiSelect from "@/components/ParametersMultiSelect";
import ModalContext from "@/contexts/ModalContext";
import styles from "./StageCustomizerModal.module.scss";

function normalizeCriteria(criteria) {
  const nums = criteria.map((c) => c || 0);
  const total = nums[0] + nums[1] + nums[2] || 1;
  return {
    vocal: Math.round((100 * nums[0]) / total) / 100,
    dance: Math.round((100 * nums[1]) / total) / 100,
    visual: Math.round((100 * nums[2]) / total) / 100,
  };
}

function StageCustomizerModal({ initialStage, onApply }) {
  const t = useTranslations("StageCustomizerModal");

  const { closeModal } = useContext(ModalContext);
  const [turnCounts, setTurnCounts] = useState(
    Object.values(initialStage.turnCounts)
  );
  const [firstTurns, setFirstTurns] = useState(
    initialStage.firstTurns.reduce((acc, cur) => ({ ...acc, [cur]: true }), {})
  );
  const [criteria, setCriteria] = useState(
    Object.values(initialStage.criteria)
  );
  const [effects, setEffects] = useState(
    serializeEffectSequence(initialStage.effects)
  );

  function apply() {
    onApply({
      id: "custom",
      plan: "free",
      turnCounts: {
        vocal: turnCounts[0] || 0,
        dance: turnCounts[1] || 0,
        visual: turnCounts[2] || 0,
      },
      firstTurns: Object.keys(firstTurns).filter((k) => firstTurns[k]),
      criteria: normalizeCriteria(criteria),
      effects: deserializeEffectSequence(effects.replace(/\s/g, "")),
    });
    closeModal();
  }

  return (
    <Modal>
      <div className={styles.stageCustomizer}>
        <label>{t("turnCounts")}</label>
        <ParametersInput
          parameters={turnCounts}
          onChange={setTurnCounts}
          max={100}
        />

        <label>{t("firstTurn")}</label>
        <ParametersMultiSelect value={firstTurns} onChange={setFirstTurns} />

        <label>{t("criteria")}</label>
        <ParametersInput
          parameters={criteria}
          onChange={setCriteria}
          max={100}
          round={false}
        />

        <label>{t("effects")}</label>
        <div className={styles.effects}>
          <textarea
            defaultValue={effects}
            onChange={(e) => setEffects(e.target.value)}
          />
          <a
            href="https://github.com/surisuririsu/gakumas-data/blob/master/Effects.md"
            target="_blank"
          >
            {t("effectFormat")}
          </a>
        </div>

        <Button style="primary" onClick={apply}>
          {t("apply")}
        </Button>
      </div>
    </Modal>
  );
}

export default memo(StageCustomizerModal);
