export type BuilderTable = {
  name: string;
  alias?: string;
};

export type BuilderJoin = {
  type: "INNER" | "LEFT" | "RIGHT";
  leftTable: string;
  leftColumn: string;
  rightTable: string;
  rightColumn: string;
};

export type BuilderFilter = {
  column: string;
  operator: "=" | "!=" | ">" | "<" | ">=" | "<=" | "LIKE" | "IS NULL" | "IS NOT NULL";
  value?: string;
};

export type QueryBuilderState = {
  tables: BuilderTable[];
  joins: BuilderJoin[];
  selectColumns: string[];
  filters: BuilderFilter[];
  groupBy: string[];
  orderBy: { column: string; direction: "ASC" | "DESC" }[];
  limit?: number;
};

export function generateSqlFromBuilder(state: QueryBuilderState): string {
  if (!state.tables.length) return "-- Choose a table in step 1 to start";

  const mainTable = state.tables[0];
  const mainAlias = mainTable.alias ?? mainTable.name;
  let sql = "SELECT ";

  if (state.selectColumns.length) {
    sql += state.selectColumns.join(", ");
  } else {
    sql += "*";
  }

  sql += `\nFROM ${mainTable.name}`;
  if (mainTable.alias && mainTable.alias !== mainTable.name) {
    sql += ` AS ${mainTable.alias}`;
  }

  for (const join of state.joins) {
    sql += `\n${join.type} JOIN ${join.rightTable} ON ${join.leftTable}.${join.leftColumn} = ${join.rightTable}.${join.rightColumn}`;
  }

  if (state.filters.length) {
    const conditions = state.filters.map((f) => {
      if (f.operator === "IS NULL" || f.operator === "IS NOT NULL") {
        return `${f.column} ${f.operator}`;
      }
      const val = f.value ?? "";
      const quoted = /^-?\d+(\.\d+)?$/.test(val) ? val : `'${val.replace(/'/g, "''")}'`;
      return `${f.column} ${f.operator} ${quoted}`;
    });
    sql += `\nWHERE ${conditions.join(" AND ")}`;
  }

  if (state.groupBy.length) {
    sql += `\nGROUP BY ${state.groupBy.join(", ")}`;
  }

  if (state.orderBy.length) {
    sql += `\nORDER BY ${state.orderBy.map((o) => `${o.column} ${o.direction}`).join(", ")}`;
  }

  if (state.limit) {
    sql += `\nLIMIT ${state.limit}`;
  }

  sql += ";";
  return sql;
}
