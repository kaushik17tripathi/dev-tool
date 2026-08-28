import Papa from "papaparse";

export type DetectedType = "INTEGER" | "REAL" | "TEXT" | "BOOLEAN";

export type ColumnMeta = {
  name: string;
  type: DetectedType;
  nullable: boolean;
};

export type ParsedCsv = {
  name: string;
  columns: ColumnMeta[];
  rows: Record<string, unknown>[];
  rowCount: number;
};

function sanitizeColumnName(name: string, index: number): string {
  const cleaned = name
    .trim()
    .replace(/[^\w]/g, "_")
    .replace(/^(\d)/, "_$1")
    .toLowerCase();
  return cleaned || `column_${index + 1}`;
}

function detectType(values: unknown[]): DetectedType {
  const nonEmpty = values.filter((v) => v !== null && v !== undefined && String(v).trim() !== "");
  if (!nonEmpty.length) return "TEXT";

  const allInt = nonEmpty.every((v) => /^-?\d+$/.test(String(v).trim()));
  if (allInt) return "INTEGER";

  const allNum = nonEmpty.every((v) => !Number.isNaN(Number(String(v).trim())));
  if (allNum) return "REAL";

  const allBool = nonEmpty.every((v) =>
    /^(true|false|yes|no|0|1)$/i.test(String(v).trim()),
  );
  if (allBool) return "BOOLEAN";

  return "TEXT";
}

export function parseCsvText(text: string, fileName: string): ParsedCsv {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (parsed.errors.length) {
    throw new Error(parsed.errors[0].message);
  }

  const rawFields = parsed.meta.fields ?? [];
  const columns: ColumnMeta[] = rawFields.map((field, index) => {
    const name = sanitizeColumnName(field, index);
    const values = parsed.data.map((row) => row[field]);
    const nonEmpty = values.filter((v) => v !== null && v !== undefined && String(v).trim() !== "");
    return {
      name,
      type: detectType(values),
      nullable: nonEmpty.length < values.length,
    };
  });

  const rows = parsed.data.map((row) => {
    const mapped: Record<string, unknown> = {};
    rawFields.forEach((field, index) => {
      const col = columns[index];
      const raw = row[field];
      if (raw === null || raw === undefined || String(raw).trim() === "") {
        mapped[col.name] = null;
      } else if (col.type === "INTEGER") {
        mapped[col.name] = parseInt(String(raw), 10);
      } else if (col.type === "REAL") {
        mapped[col.name] = parseFloat(String(raw));
      } else if (col.type === "BOOLEAN") {
        mapped[col.name] = /^(true|yes|1)$/i.test(String(raw).trim()) ? 1 : 0;
      } else {
        mapped[col.name] = String(raw);
      }
    });
    return mapped;
  });

  const baseName = fileName.replace(/\.[^.]+$/, "").replace(/[^\w]/g, "_").toLowerCase();

  return {
    name: baseName || "imported_data",
    columns,
    rows,
    rowCount: rows.length,
  };
}

export function generateCreateTable(parsed: ParsedCsv): string {
  const colDefs = parsed.columns.map((col) => {
    let def = `${col.name} ${col.type}`;
    if (!col.nullable) def += " NOT NULL";
    return def;
  });
  return `CREATE TABLE ${parsed.name} (\n  ${colDefs.join(",\n  ")}\n);`;
}

export function generateInsertStatements(parsed: ParsedCsv): string {
  const lines: string[] = [];
  const colNames = parsed.columns.map((c) => c.name).join(", ");

  for (const row of parsed.rows) {
    const values = parsed.columns.map((col) => {
      const val = row[col.name];
      if (val === null || val === undefined) return "NULL";
      if (col.type === "TEXT") return `'${String(val).replace(/'/g, "''")}'`;
      return String(val);
    });
    lines.push(`INSERT INTO ${parsed.name} (${colNames}) VALUES (${values.join(", ")});`);
  }
  return lines.join("\n");
}

export function importCsvToSql(parsed: ParsedCsv): string {
  return `${generateCreateTable(parsed)}\n\n${generateInsertStatements(parsed)}`;
}

export function queryResultToCsv(columns: string[], rows: unknown[][]): string {
  const data = rows.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
  return Papa.unparse(data);
}
