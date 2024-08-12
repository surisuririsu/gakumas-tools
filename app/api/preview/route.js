import { ImageResponse } from "next/og";
import Preview from "@/components/Preview";

export async function GET(request) {
  const { searchParams, host, protocol } = new URL(request.url);

  let items = searchParams.get("items") || "0-0-0-0";
  let cards = searchParams.get("cards") || "0-0-0-0-0-0_0-0-0-0-0-0";
  const empty = cards == "0-0-0-0-0-0_0-0-0-0-0-0";

  items = items.split("-").map((n) => parseInt(n, 10));
  cards = cards
    .split("_")
    .map((group) => group.split("-").map((n) => parseInt(n, 10)));

  const height =
    32 + // Margin
    48 + // P-Items
    (16 + 68 + (empty ? 0 : 8)) * Math.min(cards.length, 4) + // Card groups
    (empty ? 0 : 8); // Extra for cost

  return new ImageResponse(
    (
      <Preview
        baseUrl={`${protocol}//${host}`}
        items={items}
        cardGroups={cards}
        empty={empty}
      />
    ),
    { width: 470, height }
  );
}
