import { memo, useCallback, useMemo } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { PItems, SkillCards, Stages } from "gakumas-data";
import Button from "@/components/Button";
import { FALLBACK_STAGE } from "@/simulator/constants";
import styles from "./LoadoutHistory.module.scss";

function LoadoutSummary({ loadout, setLoadout }) {
  const t = useTranslations("StageSummary");

  const { stageId, customStage, pItemIds, skillCardIdGroups } = loadout;

  const stage = useMemo(() => {
    let stage = FALLBACK_STAGE;
    if (stageId == "custom") {
      stage = customStage;
    } else if (stageId) {
      stage = Stages.getById(stageId);
    }
    return stage;
  }, [stageId]);

  const handleClick = useCallback(
    () => setLoadout(loadout),
    [loadout, setLoadout]
  );

  return (
    <Button className={styles.summary} onClick={handleClick}>
      <div className={styles.itemsAndStage}>
        {pItemIds
          .map(PItems.getById)
          .filter((p) => p)
          .map((pItem, i) => (
            <Image
              key={i}
              src={pItem.getIcon()}
              width={40}
              alt={pItem.name}
              draggable={false}
            />
          ))}
        <span className={styles.stage}>
          {stage.id == "custom"
            ? t("custom")
            : t("stageName", { season: stage.season, stage: stage.stage })}
        </span>
      </div>
      <div className={styles.cards}>
        {skillCardIdGroups.map((group, j) => (
          <div key={j}>
            {group
              .map(SkillCards.getById)
              .filter((c) => c)
              .map((skillCard, i) => (
                <Image
                  key={i}
                  src={skillCard.getIcon()}
                  width={40}
                  alt={skillCard.name}
                  draggable={false}
                />
              ))}
          </div>
        ))}
      </div>
    </Button>
  );
}

export default memo(LoadoutSummary);
