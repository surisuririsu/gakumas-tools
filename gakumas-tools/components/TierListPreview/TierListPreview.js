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
          const ids = list.items[rank] || [];
          const overflow = list.overflow?.[rank] || 0;
          return (
            <div key={rank} style={rowStyle}>
              <div style={labelStyle}>
                {rankSrc[rank] && (
                  <img src={rankSrc[rank]} style={styles.rankIcon} />
                )}
              </div>
              <div style={styles.items}>
                {ids.map((id) => (
                  // A background image, not <img>: satori's <img> handling
                  // grows superlinearly with the number of images (256 take
                  // ~6s vs ~0.07s as backgrounds for the same output). See
                  // TierListPreview.styles.js for the other render costs.
                  <div
                    key={id}
                    style={
                      itemSrc[id]
                        ? { ...styles.item, backgroundImage: `url(${itemSrc[id]})` }
                        : styles.item
                    }
                  />
                ))}
                {overflow > 0 && (
                  <div key="overflow" style={styles.overflow}>
                    +{overflow}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
