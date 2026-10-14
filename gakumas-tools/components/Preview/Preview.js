import { Footer, Page } from "@/components/OgImage/parts";
import { SITE_HOST } from "@/components/OgImage/theme";
import PreviewPItems from "./PreviewPItems";
import PreviewSkillCardGroup from "./PreviewSkillCardGroup";
import styles, { FOOTER_SIZE } from "./Preview.styles";

export default function Preview({
  itemIds,
  skillCardIdGroups,
  customizationGroups,
  idolId,
  isEmpty,
  imageMap,
  layout,
}) {
  return (
    <Page style={styles.page}>
      <div
        style={{
          ...styles.preview,
          width: layout.width,
          height: layout.height,
          transform: `scale(${layout.scale})`,
        }}
      >
        <div style={styles.card}>
          <PreviewPItems itemIds={itemIds} imageMap={imageMap} />
          <div style={styles.groups}>
            {skillCardIdGroups.slice(0, 4).map((cards, groupIndex) => (
              <PreviewSkillCardGroup
                key={groupIndex}
                cards={cards}
                customizationGroup={customizationGroups?.[groupIndex]}
                idolId={idolId}
                isEmpty={isEmpty}
                imageMap={imageMap}
              />
            ))}
          </div>
        </div>
        <Footer size={FOOTER_SIZE} host={SITE_HOST} style={styles.footer} />
      </div>
    </Page>
  );
}
