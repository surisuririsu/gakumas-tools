import { memo } from "react";
import ButtonGroup from "@/components/ButtonGroup";
import Image from "@/components/Image";
import styles from "./PIdolCollection.module.scss";
import { rarityIconWidth } from "./utils";

const ALL = "all";
const RARITIES = ["R", "SR", "SSR"];

const OPTIONS = [
  {
    value: ALL,
    label: <Image src="/all.png" alt="All" width={22} height={22} />,
  },
  ...RARITIES.map((rarity) => ({
    value: rarity,
    label: (
      <Image
        src={`/rarities/${rarity}.png`}
        alt={rarity}
        width={rarityIconWidth(rarity, 22)}
        height={22}
      />
    ),
  })),
];

function RaritySelect({ selected, onChange }) {
  return (
    <ButtonGroup
      className={styles.raritySelect}
      options={OPTIONS}
      selected={selected ?? ALL}
      onChange={(value) => onChange(value == ALL ? null : value)}
    />
  );
}

export default memo(RaritySelect);
