export function parseCsvRecords(text) {
  const [header, ...rows] = parseCsvRows(text);
  return rows.map((row) =>
    Object.fromEntries(header.map((key, i) => [key, toValue(row[i])]))
  );
}

function toValue(field) {
  if (field === "TRUE") return true;
  if (field === "FALSE") return false;
  if (/^\d+$/.test(field)) return parseInt(field, 10);
  return field;
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  const endRow = () => {
    row.push(field);
    if (row.length > 1 || field) rows.push(row);
    row = [];
    field = "";
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char !== '"') {
        field += char;
      } else if (text[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        quoted = false;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\r" || char === "\n") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      endRow();
    } else {
      field += char;
    }
  }
  if (row.length || field) endRow();

  return rows;
}
