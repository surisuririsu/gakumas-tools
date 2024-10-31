import { PItems, SkillCards } from "@/utils/data";

export default function Preview({
  baseUrl,
  itemIds,
  skillCardIdGroups,
  isEmpty,
}) {
  const styles = {
    preview: {
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      padding: "16px",
      backgroundColor: "#f6f6f6",
    },
    row: { display: "flex", gap: "6px" },
    item: {
      width: "48px",
      height: "48px",
      display: "flex",
      boxShadow: "inset 0 0 0 2px #ccc",
      borderRadius: "10%",
      backgroundColor: "#eee",
      overflow: "hidden",
    },
    url: {
      flexGrow: 1,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      color: "#666",
      fontSize: "20px",
    },
    cardGroup: { display: "flex", flexDirection: "column" },
    card: {
      width: "68px",
      height: "68px",
      display: "flex",
      boxShadow: "inset 0 0 0 2px #ccc",
      borderRadius: "8%",
      backgroundColor: "#eee",
      overflow: "hidden",
    },
    cost: { display: "flex", height: isEmpty ? 0 : "8px", color: "#444" },
  };

  return (
    <div style={styles.preview}>
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
      {skillCardIdGroups.slice(0, 4).map((cards, groupIndex) => (
        <div key={groupIndex} style={styles.cardGroup}>
          <div style={styles.row}>
            {cards
              .slice(0, 6)
              .map(SkillCards.getById)
              .map((card, index) => (
                <div key={index} style={styles.card}>
                  {card && (
                    <img
                      src={`${baseUrl}${card._getIcon().src}`}
                      width={68}
                      height={68}
                    />
                  )}
                </div>
              ))}
          </div>
          <div style={styles.cost}>
            {!isEmpty && (
              <>
                Cost:{" "}
                {cards
                  .slice(0, 6)
                  .filter((id) => id)
                  .map(SkillCards.getById)
                  .reduce(
                    (acc, cur) =>
                      acc + (cur.sourceType == "pIdol" ? 0 : cur.contestPower),
                    0
                  )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
