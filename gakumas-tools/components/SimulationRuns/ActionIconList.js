import { memo } from "react";
import IconButton from "@/components/IconButton";

function ActionIconList({ items }) {
  return items.map((a) => (
    <span key={a.key} title={a.label}>
      <IconButton icon={a.icon} onClick={a.onClick} />
    </span>
  ));
}

export default memo(ActionIconList);
