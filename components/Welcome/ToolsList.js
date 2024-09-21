import { memo } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/Button";
import { TOOLS } from "@/utils/tools";

function ToolsList() {
  const t = useTranslations("tools");

  return (
    <ul>
      {Object.keys(TOOLS).map((key) => (
        <li key={key}>
          <Button ariaLabel={t(`${key}.title`)} href={TOOLS[key].path}>
            {TOOLS[key].icon}
          </Button>
          {t(`${key}.description`)}
        </li>
      ))}
    </ul>
  );
}

export default memo(ToolsList);
