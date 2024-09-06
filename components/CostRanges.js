import { memo } from "react";
import { useTranslations } from "next-intl";
import Table from "@/components/Table";

const RANGES = [
  { rank: "S", min: 441, max: 642 },
  { rank: "A+", min: 441, max: 594 },
  { rank: "A", min: 441, max: 519 },
  { rank: "B+", min: 306, max: 423 },
  { rank: "B", min: 306, max: 363 },
];

function CostRanges() {
  const t = useTranslations("CostRanges");

  return (
    <Table
      headers={[t("rank"), t("min"), t("max")]}
      widths={["20%", null, null]}
      rows={RANGES.map(({ rank, min, max }) => [rank, min, max])}
    />
  );
}

export default memo(CostRanges);
