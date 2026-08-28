export type ColumnProfile = {
  name: string;
  type: string;
  rows: number;
  unique: number;
  nullCount: number;
  duplicateCount: number;
  topValues: { value: string; count: number }[];
  min?: string;
  max?: string;
  mean?: number;
};

export type DatasetProfile = {
  rowCount: number;
  columnCount: number;
  missingPercent: number;
  duplicateRows: number;
  columns: ColumnProfile[];
};

function inferType(values: unknown[]): string {
  const nonNull = values.filter((v) => v !== null && v !== undefined && String(v).trim() !== "");
  if (!nonNull.length) return "TEXT";
  if (nonNull.every((v) => Number.isInteger(Number(v)) && !Number.isNaN(Number(v)))) return "INTEGER";
  if (nonNull.every((v) => !Number.isNaN(Number(v)))) return "REAL";
  if (nonNull.every((v) => /^\d{4}-\d{2}-\d{2}/.test(String(v)))) return "DATE";
  return "TEXT";
}

export function profileDataset(
  columns: string[],
  rows: unknown[][],
): DatasetProfile {
  const rowCount = rows.length;
  const columnProfiles: ColumnProfile[] = columns.map((name, colIndex) => {
    const values = rows.map((row) => row[colIndex]);
    const stringValues = values.map((v) =>
      v === null || v === undefined ? "" : String(v),
    );
    const nonEmpty = stringValues.filter((v) => v !== "");
    const nullCount = stringValues.filter((v) => v === "").length;
    const freq = new Map<string, number>();
    nonEmpty.forEach((v) => freq.set(v, (freq.get(v) ?? 0) + 1));
    const unique = freq.size;
    const duplicateCount = nonEmpty.length - unique;

    const topValues = Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([value, count]) => ({ value, count }));

    const numeric = nonEmpty
      .map((v) => Number(v))
      .filter((n) => !Number.isNaN(n));

    const profile: ColumnProfile = {
      name,
      type: inferType(values),
      rows: rowCount,
      unique,
      nullCount,
      duplicateCount,
      topValues,
    };

    if (numeric.length) {
      profile.min = String(Math.min(...numeric));
      profile.max = String(Math.max(...numeric));
      profile.mean = numeric.reduce((a, b) => a + b, 0) / numeric.length;
    }

    return profile;
  });

  const totalCells = rowCount * columns.length;
  const missingCells = columnProfiles.reduce((sum, c) => sum + c.nullCount, 0);
  const rowHashes = new Set<string>();
  let duplicateRows = 0;
  rows.forEach((row) => {
    const hash = row.map((v) => String(v ?? "")).join("|");
    if (rowHashes.has(hash)) duplicateRows += 1;
    else rowHashes.add(hash);
  });

  return {
    rowCount,
    columnCount: columns.length,
    missingPercent: totalCells ? (missingCells / totalCells) * 100 : 0,
    duplicateRows,
    columns: columnProfiles,
  };
}
