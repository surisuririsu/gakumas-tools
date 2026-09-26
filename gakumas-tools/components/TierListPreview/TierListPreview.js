import styles from "./TierListPreview.styles";

export default function TierListPreview({ list, rankSrc, itemSrc }) {
  return (
    <div style={styles.container}>
      <div style={styles.panel}>
        {list.tiers.map((rank, i) => {
          const last = i === list.tiers.length - 1;
          const rowStyle = last ? styles.rowLast : styles.row;
          const labelStyle = {
            ...styles.tierLabel,
            ...(i === 0 && styles.tierLabelFirst),
            ...(last && styles.tierLabelLast),
          };
          const ids = list.items[rank];
          const overflow = list.overflow[rank];
          return (
            <div key={rank} style={rowStyle}>
              <div style={labelStyle}>
                {rankSrc[rank] && (
                  <img src={rankSrc[rank]} style={styles.rankIcon} />
                )}
              </div>
              <div style={styles.items}>
                {/* Backgrounds, not <img>: satori's <img> path is
                    superlinear in the number of images. */}
                {ids.map((id) => (
                  <div
                    key={id}
                    style={
                      itemSrc[id]
                        ? {
                            ...styles.item,
                            backgroundImage: `url(${itemSrc[id]})`,
                          }
                        : styles.item
                    }
                  />
                ))}
                {overflow > 0 && <div style={styles.overflow}>+{overflow}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
