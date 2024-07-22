import Image from "next/image";
import { PItems } from "gakumas-data";
import styles from "./PItem.module.scss";

export default function PItem({ pItemId, index, onMouseEnter, onMouseLeave }) {
  const pItem = PItems.getById(pItemId);
  return (
    <div className={styles.pItem}>
      {pItem?.icon && (
        <Image src={pItem.icon} fill alt={pItem.name} sizes="52px" />
      )}
    </div>
  );
}
