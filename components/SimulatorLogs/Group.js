import Image from "next/image";
import { PItems, SkillCards } from "gakumas-data";
import Logs from "./Logs";
import styles from "./SimulatorLogs.module.scss";

export default function Group({ entity, childLogs, idolId }) {
  let resolvedEntity = null;
  if (entity.type == "skillCard" || entity.type == "skillCardEffect") {
    resolvedEntity = SkillCards.getById(entity.id);
  } else if (entity.type == "pItem") {
    resolvedEntity = PItems.getById(entity.id);
  }
  return (
    <div className={styles.group}>
      <div className={styles.entity}>
        {entity.type == "default" && <>持続効果「{entity.id}」</>}
        {entity.type == "stage" && <>ステージ効果</>}
        {entity.type == "skillCard" && (
          <>
            <Image
              src={resolvedEntity.getDynamicIcon(idolId)}
              width={24}
              height={24}
              alt=""
            />
            スキルカード「{resolvedEntity.name}」
          </>
        )}
        {entity.type == "skillCardEffect" && (
          <>
            <div className={styles.effect}>
              <Image
                src={resolvedEntity.getDynamicIcon(idolId)}
                width={24}
                height={24}
                alt=""
              />
            </div>
            持続効果「{resolvedEntity.name}」
          </>
        )}
        {entity.type == "pItem" && (
          <>
            <Image src={resolvedEntity.icon} width={24} height={24} alt="" />
            Pアイテム「{resolvedEntity.name}」
          </>
        )}
      </div>
      <div className={styles.childLogs}>
        <Logs logs={childLogs} idolId={idolId} />
      </div>
    </div>
  );
}
