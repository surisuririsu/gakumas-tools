import styles from "./TierListPreview.styles";

export default function TierListPreview({ list, rankSrc, itemSrc }) {
  return (
    <div style={styles.container}>
      <div style={styles.panel}>
        {list.tiers.map((rank, i) => {
          const rowStyle =
            i === list.tiers.length - 1 ? styles.rowLast : styles.row;
          const ids = list.items[rank] || [];
          return (
            <div key={rank} style={rowStyle}>
              <div style={styles.tierLabel}>
                {rankSrc[rank] && (
                  <img src={rankSrc[rank]} style={styles.rankIcon} />
                )}
              </div>
              <div style={styles.items}>
                {ids.map((id) => (
                  <div key={id} style={styles.item}>
                    {itemSrc[id] && (
                      <img src={itemSrc[id]} style={styles.itemImg} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
