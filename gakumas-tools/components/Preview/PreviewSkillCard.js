import { Customizations } from "gakumas-data";
import gkImg from "gakumas-images";
import { countCustomizations } from "@/utils/customizations";
import styles from "./Preview.styles";

export default function PreviewSkillCard({
  card,
  customizations,
  idolId,
  baseUrl,
}) {
  return (
    <div style={styles.card}>
      {card && (
        <img
          src={`${baseUrl}${gkImg(card, idolId || 6)._icon.src}`}
          width={68}
          height={68}
        />
      )}
      {!!countCustomizations(customizations) && (
        <div style={styles.customizations}>
          {Object.keys(customizations)
            .filter(
              (c11n) => customizations[c11n] && Customizations.getById(c11n)
            )
            .map((c11n) => (
              <div
                key={c11n}
                style={{
                  ...styles.customization,
                  ...styles[Customizations.getById(c11n).type],
                }}
              >
                {customizations[c11n]}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
