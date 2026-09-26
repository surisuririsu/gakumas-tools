import { Footer, Page, Raised } from "@/components/OgImage/parts";
import {
  COLORS,
  RANK_BACKGROUNDS,
  SITE_HOST,
} from "@/components/OgImage/theme";
import styles, {
  FOOTER_SIZE,
  ITEM_EDGE,
  ITEM_SIZE,
  rowHeight,
  tileCount,
} from "./TierListPreview.styles";

const ITEM_RADIUS = ITEM_SIZE * 0.06;

export default function TierListPreview({ list, rankSrc, itemSrc }) {
  return (
    <Page style={styles.preview}>
      <div style={styles.card}>
        {list.tiers.map((rank) => {
          const overflow = list.overflow[rank];
          return (
            <div
              key={rank}
              style={{
                ...styles.row,
                height: rowHeight(tileCount(list, rank)),
              }}
            >
              <div style={{ ...styles.tierLabel, ...RANK_BACKGROUNDS[rank] }}>
                {rankSrc[rank] && (
                  <img src={rankSrc[rank]} style={styles.rankIcon} />
                )}
              </div>
              <div style={styles.items}>
                {/* Backgrounds, not <img>: satori's <img> path is
                    superlinear in the number of images. */}
                {list.items[rank].map((id) => (
                  <Raised
                    key={id}
                    radius={ITEM_RADIUS}
                    edge={COLORS.iconEdge}
                    depth={ITEM_EDGE}
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
                {overflow > 0 && (
                  <Raised
                    radius={ITEM_RADIUS}
                    edge={COLORS.edge}
                    depth={ITEM_EDGE}
                    style={styles.overflow}
                  >
                    +{overflow}
                  </Raised>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <Footer size={FOOTER_SIZE} host={SITE_HOST} style={styles.footer} />
    </Page>
  );
}
