import PreviewPItems from "./PreviewPItems";
import PreviewSkillCardGroup from "./PreviewSkillCardGroup";
import styles from "./Preview.styles";

export default function Preview({
  itemIds,
  skillCardIdGroups,
  customizationGroups,
  idolId,
  isEmpty,
  imageMap,
}) {
  return (
    <div style={styles.preview}>
      <PreviewPItems itemIds={itemIds} imageMap={imageMap} />
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
  );
}
