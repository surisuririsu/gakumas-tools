import { ImageResponse } from "next/og";
import { IdolConfig } from "gakumas-engine";
import Preview from "@/components/Preview";
import { loadoutFromSearchParams } from "@/utils/simulator";

export async function GET(request) {
  const { searchParams, protocol } = new URL(request.url);

  const loadout = loadoutFromSearchParams(searchParams);
  const idolConfig = new IdolConfig(loadout);
  const { pItemIds, skillCardIdGroups, customizationGroups } = loadout;

  const isEmpty = skillCardIdGroups.every((g) => g.every((c) => c == 0));

  const height =
    32 + // Margin
    48 + // P-Items
    (16 + 68 + (isEmpty ? 0 : 8)) * Math.min(skillCardIdGroups.length, 4) + // Card groups
    (isEmpty ? 0 : 8); // Extra for cost

  return new ImageResponse(
    (
      <Preview
        baseUrl={`${protocol}//${process.env.VERCEL_PROJECT_PRODUCTION_URL}`}
        itemIds={pItemIds}
        skillCardIdGroups={skillCardIdGroups}
        customizationGroups={customizationGroups}
        idolId={idolConfig.idolId}
        isEmpty={isEmpty}
      />
    ),
    { width: 470, height }
  );
}
