"use client";
import { memo, useCallback, useState } from "react";
import EntityBank from "@/components/EntityBank";
import EntityDetails from "@/components/EntityDetails";
import styles from "./EntityReference.module.scss";

function EntityReference({ type }) {
  const [selected, setSelected] = useState(null);
  const selectedId = selected?.type == type ? selected.id : null;

  const select = useCallback(({ id }) => setSelected({ type, id }), [type]);

  return (
    <div className={styles.reference}>
      <EntityDetails type={type} id={selectedId} />
      <EntityBank
        type={type}
        onClick={select}
        selectedId={selectedId}
        includeNull={false}
      />
    </div>
  );
}

export default memo(EntityReference);
