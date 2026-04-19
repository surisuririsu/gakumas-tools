import { memo } from "react";
import c from "@/utils/classNames";
import styles from "./Table.module.scss";

function Table({ headers, widths = [], rows, className }) {
  return (
    <table className={c(styles.table, className)}>
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
