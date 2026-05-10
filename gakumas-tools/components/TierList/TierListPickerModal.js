import { memo, useMemo, useRef } from "react";
import EntityIcon from "@/components/EntityIcon";
import Image from "@/components/Image";
import Modal from "@/components/Modal";
import c from "@/utils/classNames";
import { COMPARE_FN_BY_TYPE, ENTITY_DATA_BY_TYPE } from "@/utils/entities";
import styles from "./TierListPickerModal.module.scss";

const PickerEntity = memo(function PickerEntity({
  type,
  id,
  pickedTier,
  isCurrent,
  onPick,
}) {
  return (
    <div
      className={c(
        styles.cell,
        pickedTier && styles.picked,
        isCurrent && styles.current,
      )}
    >
      <EntityIcon type={type} id={id} size="fill" onClick={onPick} />
      {pickedTier && (
        <div className={styles.tierBadge} aria-label={pickedTier}>
          <Image
            src={`/ranks/${pickedTier}.png`}
            alt={pickedTier}
            width={28}
            height={20}
            draggable={false}
          />
        </div>
      )}
    </div>
  );
});

function TierListPickerModal({
  type,
  tierKey,
  pickedById = {},
  onPick,
  onClose,
}) {
  const entities = useMemo(() => {
    const all = ENTITY_DATA_BY_TYPE[type].getAll();
    const compareFn = (a, b) => COMPARE_FN_BY_TYPE[type](b, a);
    return all.slice().sort(compareFn);
  }, [type]);

  // Stabilize onPick so memoized PickerEntity rows don't re-render on every
  // state change.
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const stableOnPick = useMemo(() => (entity) => onPickRef.current(entity), []);

  return (
    <Modal onClose={onClose}>
      <div className={styles.picker}>
        <div className={styles.entities}>
          {entities.map((entity) => {
            const pickedTier = pickedById[entity.id];
            return (
              <PickerEntity
                key={`${type}_${entity.id}`}
                type={type}
                id={entity.id}
                pickedTier={pickedTier}
                isCurrent={pickedTier === tierKey}
                onPick={stableOnPick}
              />
            );
          })}
        </div>
      </div>
    </Modal>
  );
}

export default memo(TierListPickerModal);
