import { ImageResponse } from "next/og";
import Preview from "@/components/Preview";
import { deserializeIds } from "@/utils/ids";

const DEFAULT_ITEM_IDS_STR = "0-0-0-0";
const DEFAULT_SKILL_CARD_ID_GROUPS_STR = "0-0-0-0-0-0_0-0-0-0-0-0";

export async function GET(request) {
  const { searchParams, host, protocol } = new URL(request.url);

  let itemIds = searchParams.get("items") || DEFAULT_ITEM_IDS_STR;
  let skillCardIdGroups =
    searchParams.get("cards") || DEFAULT_SKILL_CARD_ID_GROUPS_STR;

  const isEmpty = skillCardIdGroups == DEFAULT_SKILL_CARD_ID_GROUPS_STR;

  itemIds = deserializeIds(itemIds);
  skillCardIdGroups = skillCardIdGroups.split("_").map(deserializeIds);

  const height =
    32 + // Margin
    48 + // P-Items
    (16 + 68 + (isEmpty ? 0 : 8)) * Math.min(skillCardIdGroups.length, 4) + // Card groups
    (isEmpty ? 0 : 8); // Extra for cost

  return new ImageResponse(
    (
      <Preview
        baseUrl={`${protocol}//${host}`}
        itemIds={itemIds}
        skillCardIdGroups={skillCardIdGroups}
        isEmpty={isEmpty}
      />
    ),
    { width: 470, height }
  );
}
