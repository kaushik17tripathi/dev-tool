import {
  parsePostgresSchema,
  type ParsedSchema,
  type SqlRelation,
} from "./sql-parser";

function tableShortName(name: string): string {
  return (name.includes(".") ? name.split(".").pop() : name) ?? name;
}

function quoteIdentifier(name: string): string {
  const short = tableShortName(name);
  if (/^[a-z_][a-z0-9_]*$/.test(short)) return short;
  return `"${short.replace(/"/g, '""')}"`;
}

function mapPostgresTypeToSqlite(type: string): string {
  const normalized = type.replace(/\s+/g, " ").trim();
  const lower = normalized.toLowerCase();

  if (lower.includes("json")) return "TEXT";
  if (lower.startsWith("timestamp") || lower === "timestamptz") return "TEXT";
  if (
    lower.startsWith("character varying") ||
    lower === "varchar" ||
    lower === "text"
  ) {
    return "TEXT";
  }
  if (lower.startsWith("uuid")) return "TEXT";
  if (lower.startsWith("numeric") || lower.startsWith("decimal")) return "NUMERIC";
  if (lower.startsWith("double") || lower.startsWith("real") || lower.startsWith("float")) {
    return "REAL";
  }
  if (lower.startsWith("bigint") || lower.startsWith("smallint") || lower.startsWith("integer")) {
    return "INTEGER";
  }
  if (lower === "int") return "INTEGER";
  if (lower === "boolean") return "INTEGER";
  if (normalized.startsWith('"')) return "TEXT";

  return "TEXT";
}

function relationForColumn(
  tableName: string,
  columnName: string,
  relations: SqlRelation[],
): SqlRelation | undefined {
  const shortTable = tableShortName(tableName);
  return relations.find(
    (relation) =>
      tableShortName(relation.fromTable) === shortTable &&
      relation.fromColumn === columnName,
  );
}

export function generateSqliteDdl(schema: ParsedSchema): string {
  const statements: string[] = [];

  for (const table of schema.tables) {
    const columnDefs: string[] = [];

    for (const column of table.columns) {
      let def = `${quoteIdentifier(column.name)} ${mapPostgresTypeToSqlite(column.type)}`;
      if (column.primaryKey) def += " PRIMARY KEY";
      else if (!column.nullable) def += " NOT NULL";
      if (column.unique && !column.primaryKey) def += " UNIQUE";

      const relation = relationForColumn(table.name, column.name, schema.relations);
      if (relation) {
        def += ` REFERENCES ${quoteIdentifier(relation.toTable)}(${quoteIdentifier(relation.toColumn)})`;
      }

      columnDefs.push(def);
    }

    statements.push(
      `CREATE TABLE ${quoteIdentifier(table.name)} (\n  ${columnDefs.join(",\n  ")}\n);`,
    );
  }

  return statements.join("\n\n");
}

function looksLikePostgresDdl(sql: string): boolean {
  return (
    /\bpublic\s*\./i.test(sql) ||
    /\bjsonb\b/i.test(sql) ||
    /\bCOLLATE\b/i.test(sql) ||
    /'::/i.test(sql) ||
    /\btimestamp\s*\(\s*\d+\s*\)\s+without\s+time\s+zone\b/i.test(sql) ||
    /\bcharacter\s+varying\b/i.test(sql) ||
    /\bMATCH\s+SIMPLE\b/i.test(sql)
  );
}

export function prepareDdlForSqlite(input: string): string {
  const trimmed = input.trim();
  if (!trimmed || !looksLikePostgresDdl(trimmed)) return trimmed;

  const schema = parsePostgresSchema(trimmed);
  return generateSqliteDdl(schema);
}
