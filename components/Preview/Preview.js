import PreviewPItems from "./PreviewPItems";
import PreviewSkillCardGroup from "./PreviewSkillCardGroup";
import styles from "./Preview.styles";

export default function Preview({
  baseUrl,
  itemIds,
  skillCardIdGroups,
  customizationGroups,
  isEmpty,
}) {
  return (
    <div style={styles.preview}>
      <PreviewPItems itemIds={itemIds} baseUrl={baseUrl} />
      {skillCardIdGroups.slice(0, 4).map((cards, groupIndex) => (
        <PreviewSkillCardGroup
          key={groupIndex}
          cards={cards}
          customizationGroup={customizationGroups?.[groupIndex]}
          baseUrl={baseUrl}
          isEmpty={isEmpty}
        />
      ))}
    </div>
  );
}
