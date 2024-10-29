import { memo, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/Button";
import Image from "@/components/Image";
import { FALLBACK_STAGE } from "@/simulator/constants";
import { PItems, SkillCards, Stages } from "@/utils/data";
import { formatStageName } from "@/utils/stages";
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
              height={40}
              alt={pItem.name}
              draggable={false}
            />
          ))}
        <span className={styles.stage}>{formatStageName(stage, t)}</span>
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
                  height={40}
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
