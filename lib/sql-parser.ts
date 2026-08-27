export type SqlColumn = {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  unique: boolean;
};

export type SqlTable = {
  name: string;
  columns: SqlColumn[];
};

export type SqlRelation = {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
};

export type ParsedSchema = {
  tables: SqlTable[];
  relations: SqlRelation[];
};

const identifier = `(?:"(?:[^"]|"")+"|[\\w$]+)`;
const qualifiedIdentifier = `${identifier}(?:\\s*\\.\\s*${identifier})?`;

function cleanIdentifier(value: string) {
  return value
    .split(".")
    .map((part) => part.trim().replace(/^"|"$/g, "").replace(/""/g, '"'))
    .join(".");
}

function stripComments(sql: string) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--.*$/gm, " ");
}

function splitTopLevel(value: string) {
  const parts: string[] = [];
  let start = 0;
  let depth = 0;
  let quote: "'" | '"' | null = null;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const next = value[index + 1];

    if (quote) {
      if (char === quote && next === quote) {
        index += 1;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === "'" || char === '"') quote = char;
    else if (char === "(") depth += 1;
    else if (char === ")") depth -= 1;
    else if (char === "," && depth === 0) {
      parts.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }

  parts.push(value.slice(start).trim());
  return parts.filter(Boolean);
}

function findClosingParenthesis(sql: string, openingIndex: number) {
  let depth = 0;
  let quote: "'" | '"' | null = null;

  for (let index = openingIndex; index < sql.length; index += 1) {
    const char = sql[index];
    const next = sql[index + 1];

    if (quote) {
      if (char === quote && next === quote) index += 1;
      else if (char === quote) quote = null;
      continue;
    }

    if (char === "'" || char === '"') quote = char;
    else if (char === "(") depth += 1;
    else if (char === ")" && --depth === 0) return index;
  }

  return -1;
}

function parseColumnType(definition: string) {
  const keyword =
    /\s+(?:CONSTRAINT|NOT\s+NULL|NULL|DEFAULT|PRIMARY\s+KEY|UNIQUE|REFERENCES|CHECK|GENERATED|COLLATE)\b/i;
  const match = keyword.exec(definition);
  return (match ? definition.slice(0, match.index) : definition).trim();
}

function parseColumn(definition: string): SqlColumn | null {
  const match = new RegExp(`^\\s*(${identifier})\\s+([\\s\\S]+)$`, "i").exec(
    definition,
  );
  if (!match) return null;

  const name = cleanIdentifier(match[1]);
  const remainder = match[2].trim();
  const type = parseColumnType(remainder);
  if (!type) return null;
  const primaryKey = /\bPRIMARY\s+KEY\b/i.test(remainder);

  return {
    name,
    type: type.replace(/\s+/g, " "),
    nullable: !primaryKey && !/\bNOT\s+NULL\b/i.test(remainder),
    primaryKey,
    unique: /\bUNIQUE\b/i.test(remainder),
  };
}

function parseColumnList(value: string) {
  return splitTopLevel(value).map(cleanIdentifier);
}

export function parsePostgresSchema(input: string): ParsedSchema {
  const sql = stripComments(input);
  const tables: SqlTable[] = [];
  const relations: SqlRelation[] = [];
  const tablePattern = new RegExp(
    `CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(${qualifiedIdentifier})\\s*\\(`,
    "gi",
  );

  let tableMatch: RegExpExecArray | null;
  while ((tableMatch = tablePattern.exec(sql))) {
    const tableName = cleanIdentifier(tableMatch[1]);
    const openingIndex = tablePattern.lastIndex - 1;
    const closingIndex = findClosingParenthesis(sql, openingIndex);
    if (closingIndex === -1) {
      throw new Error(`The CREATE TABLE statement for "${tableName}" is incomplete.`);
    }

    const table: SqlTable = { name: tableName, columns: [] };
    const pendingPrimaryKeys = new Set<string>();
    const body = sql.slice(openingIndex + 1, closingIndex);

    for (const definition of splitTopLevel(body)) {
      const withoutConstraintName = definition.replace(
        new RegExp(`^CONSTRAINT\\s+${identifier}\\s+`, "i"),
        "",
      );

      const primaryMatch = /^PRIMARY\s+KEY\s*\(([^)]+)\)/i.exec(
        withoutConstraintName,
      );
      if (primaryMatch) {
        parseColumnList(primaryMatch[1]).forEach((name) =>
          pendingPrimaryKeys.add(name),
        );
        continue;
      }

      const foreignMatch = new RegExp(
        `^FOREIGN\\s+KEY\\s*\\(([^)]+)\\)\\s+REFERENCES\\s+(${qualifiedIdentifier})\\s*\\(([^)]+)\\)`,
        "i",
      ).exec(withoutConstraintName);
      if (foreignMatch) {
        const fromColumns = parseColumnList(foreignMatch[1]);
        const toTable = cleanIdentifier(foreignMatch[2]);
        const toColumns = parseColumnList(foreignMatch[3]);
        fromColumns.forEach((fromColumn, index) => {
          if (toColumns[index]) {
            relations.push({
              fromTable: tableName,
              fromColumn,
              toTable,
              toColumn: toColumns[index],
            });
          }
        });
        continue;
      }

      if (/^(?:UNIQUE|CHECK|EXCLUDE)\b/i.test(withoutConstraintName)) continue;

      const column = parseColumn(definition);
      if (!column) continue;
      table.columns.push(column);

      const inlineReference = new RegExp(
        `\\bREFERENCES\\s+(${qualifiedIdentifier})\\s*\\(\\s*(${identifier})\\s*\\)`,
        "i",
      ).exec(definition);
      if (inlineReference) {
        relations.push({
          fromTable: tableName,
          fromColumn: column.name,
          toTable: cleanIdentifier(inlineReference[1]),
          toColumn: cleanIdentifier(inlineReference[2]),
        });
      }
    }

    table.columns.forEach((column) => {
      if (pendingPrimaryKeys.has(column.name)) {
        column.primaryKey = true;
        column.nullable = false;
      }
    });
    tables.push(table);
    tablePattern.lastIndex = closingIndex + 1;
  }

  const alterPattern = new RegExp(
    `ALTER\\s+TABLE\\s+(?:IF\\s+EXISTS\\s+)?(?:ONLY\\s+)?(${qualifiedIdentifier})[\\s\\S]*?FOREIGN\\s+KEY\\s*\\(([^)]+)\\)\\s+REFERENCES\\s+(${qualifiedIdentifier})\\s*\\(([^)]+)\\)`,
    "gi",
  );
  let alterMatch: RegExpExecArray | null;
  while ((alterMatch = alterPattern.exec(sql))) {
    const fromTable = cleanIdentifier(alterMatch[1]);
    const toTable = cleanIdentifier(alterMatch[3]);
    const fromColumns = parseColumnList(alterMatch[2]);
    const toColumns = parseColumnList(alterMatch[4]);
    fromColumns.forEach((fromColumn, index) => {
      if (toColumns[index]) {
        relations.push({
          fromTable,
          fromColumn,
          toTable,
          toColumn: toColumns[index],
        });
      }
    });
  }

  if (!tables.length) {
    throw new Error("No PostgreSQL CREATE TABLE statements were found.");
  }

  return { tables, relations };
}
