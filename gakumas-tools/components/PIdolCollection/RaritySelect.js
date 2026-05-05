import { memo } from "react";
import Image from "@/components/Image";
import c from "@/utils/classNames";
import styles from "./PIdolCollection.module.scss";

const RARITIES = ["R", "SR", "SSR"];

function RaritySelect({ selected, onChange }) {
  return (
    <div className={styles.raritySelect}>
      <button
        type="button"
        className={c(
          styles.rarityOption,
          styles.rarityAll,
          selected === null && styles.raritySelected,
        )}
        onClick={() => onChange(null)}
      >
        <Image src="/all.png" alt="All" width={24} height={24} />
      </button>
      {RARITIES.map((rarity) => (
        <button
          key={rarity}
          type="button"
          className={c(
            styles.rarityOption,
            selected === rarity && styles.raritySelected,
          )}
          onClick={() => onChange(rarity)}
        >
          <Image
            src={`/rarities/${rarity}.png`}
            alt={rarity}
            width={60}
            height={20}
          />
        </button>
      ))}
    </div>
  );
}

export default memo(RaritySelect);
