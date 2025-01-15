import { Customizations } from "gakumas-data/lite";
import { countCustomizations } from "@/utils/customizations";
import styles from "./Preview.styles";

export default function PreviewSkillCard({ card, customizations, baseUrl }) {
  return (
    <div style={styles.card}>
      {card && (
        <img src={`${baseUrl}${card._getIcon().src}`} width={68} height={68} />
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
