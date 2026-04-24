import { PItems } from "gakumas-data";
import gkImg from "gakumas-images";
import { iconSrc } from "./iconSrc";
import styles from "./Preview.styles";

export default function PreviewPItems({ itemIds, imageMap }) {
  return (
    <div style={styles.row}>
      {itemIds
        .slice(0, 4)
        .map(PItems.getById)
        .map((item, index) => {
          const icon = item && gkImg(item).icon;
          const src = iconSrc(icon, imageMap);
          return (
            <div key={index} style={styles.item}>
              {src && <img src={src} width={48} height={48} />}
            </div>
          );
        })}
      <div style={styles.url}>gktools.ris.moe</div>
    </div>
  );
}
