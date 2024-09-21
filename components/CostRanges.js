import { memo } from "react";
import { useTranslations } from "next-intl";
import Table from "@/components/Table";
import { COST_RANGES } from "@/utils/contestPower";

function CostRanges() {
  const t = useTranslations("CostRanges");

  return (
    <Table
      headers={[t("rank"), t("min"), t("max")]}
      widths={["20%", null, null]}
      rows={COST_RANGES.map(({ rank, min, max }) => [rank, min, max])}
    />
  );
}

export default memo(CostRanges);
