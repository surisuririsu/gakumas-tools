import Image from "next/image";
import { FaRegRectangleList } from "react-icons/fa6";
import { ENTITY_DATA_BY_TYPE } from "@/utils/entities";
import styles from "./EntityDetails.module.scss";

export default function EntityDetails({ type, id }) {
  const entity = ENTITY_DATA_BY_TYPE[type]?.getById(id);

  return (
    <div className={styles.entityDetails}>
      {entity ? (
        <Image
          src={entity.details}
          alt={entity.name}
          fill
          sizes="400px"
          draggable={false}
        />
      ) : (
        <div className={styles.placeholder}>
          <FaRegRectangleList />
        </div>
      )}
    </div>
  );
}
