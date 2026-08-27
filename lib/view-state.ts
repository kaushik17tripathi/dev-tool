import { v4 as uuidv4 } from "uuid";
import type { QueryResult } from "@/lib/database";
import type { EditorTab, QueryHistoryEntry } from "@/lib/project-store";
import type { QueryBuilderState } from "@/lib/query-builder-sql";
import type { DesignerTable } from "@/lib/schema-ddl";

export type IsolatedViewId = "playground" | "query-builder" | "erd";

export type PersistedIsolatedDb = {
  sql: string;
  dbBytes: Uint8Array | null;
  ready: boolean;
};

export type PlaygroundViewState = {
  isolated: PersistedIsolatedDb;
  tabs: EditorTab[];
  activeTabId: string;
  lastResults: QueryResult[];
  lastError: string | null;
  queryHistory: QueryHistoryEntry[];
  selectedTable: string | null;
};

export type QueryBuilderViewState = {
  isolated: PersistedIsolatedDb;
  builder: QueryBuilderState;
  showAdvanced: boolean;
};

export type ErdViewState = {
  isolated: PersistedIsolatedDb;
};

export type SchemaDesignerViewState = {
  designTables: DesignerTable[];
  selectedIdx: number;
};

export type WorkspaceViewState = {
  playground: PlaygroundViewState;
  "query-builder": QueryBuilderViewState;
  erd: ErdViewState;
  "schema-designer": SchemaDesignerViewState;
};

export const EMPTY_BUILDER_STATE: QueryBuilderState = {
  tables: [],
  joins: [],
  selectColumns: [],
  filters: [],
  groupBy: [],
  orderBy: [],
};

function defaultEditorTabs(): EditorTab[] {
  return [{ id: uuidv4(), name: "Query 1", sql: "SELECT * FROM users;" }];
}

function emptyDesignerTable(): DesignerTable {
  return {
    name: `table_${Date.now()}`,
    columns: [
      {
        name: "id",
        type: "INTEGER",
        primaryKey: true,
        notNull: true,
        unique: false,
      },
    ],
  };
}

export function emptyIsolatedDb(): PersistedIsolatedDb {
  return { sql: "", dbBytes: null, ready: false };
}

export function createDefaultViewState(): WorkspaceViewState {
  const tabs = defaultEditorTabs();
  return {
    playground: {
      isolated: emptyIsolatedDb(),
      tabs,
      activeTabId: tabs[0].id,
      lastResults: [],
      lastError: null,
      queryHistory: [],
      selectedTable: null,
    },
    "query-builder": {
      isolated: emptyIsolatedDb(),
      builder: { ...EMPTY_BUILDER_STATE },
      showAdvanced: false,
    },
    erd: {
      isolated: emptyIsolatedDb(),
    },
    "schema-designer": {
      designTables: [emptyDesignerTable()],
      selectedIdx: 0,
    },
  };
}
