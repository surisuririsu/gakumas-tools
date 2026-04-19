import { PItems } from "gakumas-data";
import gkImg from "gakumas-images";
import styles from "./Preview.styles";

export default function PreviewPItems({ itemIds, baseUrl }) {
  return (
    <div style={styles.row}>
      {itemIds
        .slice(0, 4)
        .map(PItems.getById)
        .map((item, index) => (
          <div key={index} style={styles.item}>
            {item && (
              <img
                src={`${baseUrl}${gkImg(item)._icon.src}`}
                width={48}
                height={48}
              />
            )}
          </div>
        ))}
      <div style={styles.url}>gktools.ris.moe</div>
    </div>
  );
}
