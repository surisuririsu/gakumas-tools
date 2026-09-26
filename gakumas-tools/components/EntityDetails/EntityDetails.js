import { memo, useContext, useState } from "react";
import { useTranslations } from "next-intl";
import { FaRegRectangleList } from "react-icons/fa6";
import gkImg from "gakumas-images";
import Image from "@/components/Image";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import c from "@/utils/classNames";
import { ENTITY_DATA_BY_TYPE, resolveEntityIcon } from "@/utils/entities";
import AvailableCustomizations from "./AvailableCustomizations";
import styles from "./EntityDetails.module.scss";

const LAYER_CLASSES = {
  pending: styles.pending,
  entering: styles.entering,
  held: null,
  leaving: styles.leaving,
};

function DetailsLayer({ entity, idolId, phase, onReady, onExited }) {
  const t = useTranslations("Dex");
  const { details } = gkImg(entity);
  const icon = resolveEntityIcon(entity, idolId);

  return (
    <div
      className={c(styles.layer, LAYER_CLASSES[phase])}
      onAnimationEnd={(e) => {
        if (phase == "leaving" && e.target === e.currentTarget) onExited();
      }}
    >
      <div className={styles.side}>
        <div className={styles.icon}>
          {icon && (
            <Image src={icon} alt="" fill sizes="80px" draggable={false} />
          )}
        </div>
        {entity.plan && (
          <span className={styles.tag}>
            <Image
              src={`/plans/${entity.plan}.png`}
              alt=""
              width={14}
              height={14}
            />
            {t(`plans.${entity.plan}`)}
          </span>
        )}
        {entity.unlockPlv > 1 && (
          <span className={styles.tag}>
            {t("unlockPlv", { n: entity.unlockPlv })}
          </span>
        )}
      </div>
      <div className={styles.main}>
        <div className={styles.title}>{entity.name}</div>
        <div className={styles.description}>
          <div className={styles.crop}>
            <Image
              src={details}
              alt={entity.name}
              width={500}
              height={215}
              draggable={false}
              onLoad={onReady}
              onError={onReady}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function nextView(view, current) {
  const previous = view.ready || !view.current ? view.current : view.previous;
  if (current && previous?.key === current.key) {
    return { current, previous: null, ready: true };
  }
  return { current, previous, ready: !current };
}

function EntityDetails({ type, id }) {
  const { idolId } = useContext(WorkspaceContext);
  const entity = ENTITY_DATA_BY_TYPE[type]?.getById(id);
  const key = entity ? `${type}_${entity.id}` : null;

  const [view, setView] = useState(() => ({
    current: entity ? { key, entity } : null,
    previous: null,
    ready: !entity,
  }));
  if ((view.current?.key ?? null) !== key) {
    setView(nextView(view, entity ? { key, entity } : null));
  }

  const { current, previous, ready } = view;
  const markReady = (readyKey) =>
    setView((v) => (v.current?.key === readyKey ? { ...v, ready: true } : v));
  const clearPrevious = (exitedKey) =>
    setView((v) =>
      v.previous?.key === exitedKey ? { ...v, previous: null } : v,
    );

  return (
    <div className={styles.entityDetails}>
      <div className={styles.stage}>
        {(!current || (!ready && !previous)) && (
          <div className={styles.placeholder}>
            <FaRegRectangleList />
          </div>
        )}
        {previous && (
          <DetailsLayer
            key={previous.key}
            entity={previous.entity}
            idolId={idolId}
            phase={ready ? "leaving" : "held"}
            onExited={() => clearPrevious(previous.key)}
          />
        )}
        {current && (
          <DetailsLayer
            key={current.key}
            entity={current.entity}
            idolId={idolId}
            phase={ready ? "entering" : "pending"}
            onReady={() => markReady(current.key)}
          />
        )}
      </div>
      <AvailableCustomizations entity={entity} />
    </div>
  );
}

export default memo(EntityDetails);
