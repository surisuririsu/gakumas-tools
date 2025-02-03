import { memo } from "react";
import { FaRegRectangleList } from "react-icons/fa6";
import Image from "@/components/Image";
import { ENTITY_DATA_BY_TYPE } from "@/utils/entities";
import AvailableCustomizations from "./AvailableCustomizations";
import styles from "./EntityDetails.module.scss";

function EntityDetails({ type, id }) {
  const entity = ENTITY_DATA_BY_TYPE[type]?.getById(id);

  return (
    <div className={styles.entityDetails}>
      {entity ? (
        <>
          <div className={styles.imageWrapper}>
            <Image
              src={entity.details}
              alt={entity.name}
              fill
              sizes="400px"
              draggable={false}
            />
          </div>
        </>
      ) : (
        <div className={styles.placeholder}>
          <FaRegRectangleList />
        </div>
      )}
      <AvailableCustomizations entity={entity} />
    </div>
  );
}

export default memo(EntityDetails);
