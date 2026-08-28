import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";
import { DEMO_SEED_SQL } from "./demo-data";

let sqlPromise: Promise<SqlJsStatic> | null = null;

export type QueryResult = {
  columns: string[];
  rows: unknown[][];
  rowsAffected?: number;
  durationMs: number;
};

export type TableInfo = {
  name: string;
  columns: { name: string; type: string; pk: boolean; notnull: boolean }[];
};

async function getSQL(): Promise<SqlJsStatic> {
  if (!sqlPromise) {
    sqlPromise = initSqlJs({
      locateFile: (file: string) => {
        // Browser build requests sql-wasm-browser.wasm; public/ ships sql-wasm.wasm (same binary).
        const wasmFile = file === "sql-wasm-browser.wasm" ? "sql-wasm.wasm" : file;
        return `/${wasmFile}`;
      },
    });
  }
  return sqlPromise;
}

export async function createDatabase(seedSql = DEMO_SEED_SQL): Promise<Database> {
  const SQL = await getSQL();
  const db = new SQL.Database();
  if (seedSql.trim()) {
    db.run(seedSql);
  }
  return db;
}

export async function loadDatabaseFromBytes(bytes: Uint8Array): Promise<Database> {
  const SQL = await getSQL();
  return new SQL.Database(bytes);
}

export function exportDatabaseBytes(db: Database): Uint8Array {
  return db.export();
}

export function executeQuery(db: Database, sql: string): QueryResult[] {
  const start = performance.now();
  const results: QueryResult[] = [];

  const stmtStart = performance.now();
  const execResults = db.exec(sql);
  if (execResults.length === 0) {
    results.push({
      columns: [],
      rows: [],
      rowsAffected: db.getRowsModified(),
      durationMs: performance.now() - stmtStart,
    });
  } else {
    for (const result of execResults) {
      results.push({
        columns: result.columns,
        rows: result.values,
        durationMs: performance.now() - stmtStart,
      });
    }
  }

  if (results.length === 0) {
    results.push({
      columns: [],
      rows: [],
      durationMs: performance.now() - start,
    });
  }

  return results;
}

export function getTableNames(db: Database): string[] {
  const result = db.exec(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  );
  if (!result.length) return [];
  return result[0].values.map((row) => String(row[0]));
}

export function getTableInfo(db: Database, tableName: string): TableInfo {
  const pragma = db.exec(`PRAGMA table_info("${tableName.replace(/"/g, '""')}")`);
  if (!pragma.length) return { name: tableName, columns: [] };

  return {
    name: tableName,
    columns: pragma[0].values.map((row) => ({
      name: String(row[1]),
      type: String(row[2]),
      notnull: Number(row[3]) === 1,
      pk: Number(row[5]) > 0,
    })),
  };
}

export function getAllTablesInfo(db: Database): TableInfo[] {
  return getTableNames(db).map((name) => getTableInfo(db, name));
}

export function getTableDDL(db: Database): string {
  const tables = getTableNames(db);
  const parts: string[] = [];
  for (const table of tables) {
    const result = db.exec(
      `SELECT sql FROM sqlite_master WHERE type='table' AND name='${table.replace(/'/g, "''")}'`,
    );
    if (result.length && result[0].values[0]?.[0]) {
      parts.push(String(result[0].values[0][0]) + ";");
    }
  }
  return parts.join("\n\n");
}

export function getTablePreview(db: Database, tableName: string, limit = 100): QueryResult {
  const start = performance.now();
  const safeName = tableName.replace(/"/g, '""');
  const result = db.exec(`SELECT * FROM "${safeName}" LIMIT ${limit}`);
  if (!result.length) {
    return { columns: [], rows: [], durationMs: performance.now() - start };
  }
  return {
    columns: result[0].columns,
    rows: result[0].values,
    durationMs: performance.now() - start,
  };
}
