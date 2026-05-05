"use client";
import { memo, useCallback, useState } from "react";
import EntityBank from "@/components/EntityBank";
import EntityDetails from "@/components/EntityDetails";

function EntityReference({ type }) {
  const [selectedId, setSelectedId] = useState(null);

  const select = useCallback(({ id }) => setSelectedId(id), []);

  return (
    <>
      <EntityDetails type={type} id={selectedId} />
      <EntityBank type={type} onClick={select} includeNull={false} />
    </>
  );
}

export default memo(EntityReference);
