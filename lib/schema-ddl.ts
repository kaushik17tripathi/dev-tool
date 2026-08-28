export type DesignerColumn = {
  name: string;
  type: string;
  primaryKey: boolean;
  notNull: boolean;
  unique: boolean;
  defaultValue?: string;
  references?: { table: string; column: string };
};

export type DesignerTable = {
  name: string;
  columns: DesignerColumn[];
};

export function generateCreateTableDDL(table: DesignerTable): string {
  const colDefs = table.columns.map((col) => {
    let def = `${col.name} ${col.type}`;
    if (col.primaryKey) def += " PRIMARY KEY";
    if (col.notNull && !col.primaryKey) def += " NOT NULL";
    if (col.unique && !col.primaryKey) def += " UNIQUE";
    if (col.defaultValue) def += ` DEFAULT ${col.defaultValue}`;
    if (col.references) {
      def += ` REFERENCES ${col.references.table}(${col.references.column})`;
    }
    return def;
  });

  return `CREATE TABLE ${table.name} (\n  ${colDefs.join(",\n  ")}\n);`;
}

export function generateSchemaDDL(tables: DesignerTable[]): string {
  return tables.map(generateCreateTableDDL).join("\n\n");
}

export const SQL_TYPES = [
  "INTEGER",
  "REAL",
  "TEXT",
  "BLOB",
  "BOOLEAN",
  "DATE",
  "TIMESTAMP",
  "VARCHAR(100)",
  "VARCHAR(255)",
];
