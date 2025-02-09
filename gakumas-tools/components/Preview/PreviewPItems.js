import { PItems } from "@/utils/data";
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
                src={`${baseUrl}${item._getIcon().src}`}
                width={48}
                height={48}
              />
            )}
          </div>
        ))}
      <div style={styles.url}>gkcontest.ris.moe</div>
    </div>
  );
}
