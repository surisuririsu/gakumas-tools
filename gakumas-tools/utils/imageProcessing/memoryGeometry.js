// Per-card box positions for the memory screen, anchored to the OCR-located
// "Pアイテム" label line. Pure geometry — no DOM or OCR dependencies — so
// this is shared between the browser entry point (`memory.js`) and the Node
// regression harness.

export function getPItemBoundingBoxes(anchorPoint, contentWidth) {
  const pItemsTL = {
    x: anchorPoint.x - contentWidth * 0.006,
    y: anchorPoint.y + contentWidth * 0.03,
  };
  const pItemsWidth = contentWidth * 0.147;
  const pItemsGap = contentWidth * 0.023;
  const pItemBoxes = [];
  for (let i = 0; i < 4; i++) {
    pItemBoxes.push({
      x: pItemsTL.x + i * (pItemsWidth + pItemsGap),
      y: pItemsTL.y,
      width: pItemsWidth,
      height: pItemsWidth,
    });
  }
  return pItemBoxes;
}

export function getSkillCardBoundingBoxes(anchorPoint, contentWidth) {
  const skillCardsTL = {
    x: anchorPoint.x - contentWidth * 0.003,
    y: anchorPoint.y + contentWidth * 0.302,
  };
  const skillCardsWidth = contentWidth * 0.248;
  const skillCardsHGap = contentWidth * 0.023;
  const skillCardsVGap = contentWidth * 0.067;
  const skillCardBoxes = [];
  for (let i = 0; i < 6; i++) {
    skillCardBoxes.push({
      x: skillCardsTL.x + (i % 4) * (skillCardsWidth + skillCardsHGap),
      y:
        skillCardsTL.y + Math.floor(i / 4) * (skillCardsWidth + skillCardsVGap),
      width: skillCardsWidth,
      height: skillCardsWidth,
    });
  }
  return skillCardBoxes;
}
