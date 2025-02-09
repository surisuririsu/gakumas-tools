import { memo } from "react";
import styles from "./Table.module.scss";

function Table({ headers, widths = [], rows }) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          {headers.map((header, i) => (
            <th key={header} width={widths[i]}>
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((d, j) => (
              <td key={j}>{d}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default memo(Table);
