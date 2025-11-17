"use client";
import { useContext } from "react";
import { useTranslations } from "next-intl";
import LoadoutParams from "@/components/LoadoutParams";
import StagePItems from "@/components/StagePItems";
import LoadoutSkillCardGroup from "@/components/LoadoutSkillCardGroup";
import LoadoutContext from "@/contexts/LoadoutContext";
import { getIndications } from "@/utils/simulator";
import { formatStageShortName } from "@/utils/stages";
import styles from "./LoadoutEditor.module.scss";

export default function LoadoutEditor({ config, idolId }) {
  const t = useTranslations("Simulator");

  const { stage, loadout, setParams, replacePItemId, swapPItemIds } =
    useContext(LoadoutContext);

  const { pItemIndications, skillCardIndicationGroups } = getIndications(
    config,
    loadout
  );

  return (
    <div className={styles.loadoutEditor}>
      <LoadoutParams
        params={loadout.params}
        onChange={setParams}
        withStamina
        typeMultipliers={config.typeMultipliers}
      />
      <div className={styles.pItemsRow}>
        <div className={styles.pItems}>
          <StagePItems
            pItemIds={loadout.pItemIds}
            replacePItemId={replacePItemId}
            swapPItemIds={swapPItemIds}
            indications={pItemIndications}
            size="medium"
          />
        </div>
        <span>{formatStageShortName(stage, t)}</span>
      </div>
      {loadout.skillCardIdGroups.map((skillCardIdGroup, i) => (
        <LoadoutSkillCardGroup
          key={i}
          skillCardIds={skillCardIdGroup}
          customizations={loadout.customizationGroups[i]}
          indications={skillCardIndicationGroups[i]}
          groupIndex={i}
          idolId={config.idol.idolId || idolId}
        />
      ))}
    </div>
  );
}
