"use client";

import SchemaSqlPanel from "@/components/shared/SchemaSqlPanel";
import SchemaVisualizer from "@/components/SchemaVisualizer";
import { useIsolatedDatabase } from "@/hooks/useIsolatedDatabase";

export default function ERDiagramView() {
  const { sql, setSql, tables, error, loading, ready, loadSchema } =
    useIsolatedDatabase("erd");
  const diagramSql = ready ? sql.trim() : "";

  return (
    <div className="independent-layout erd-independent-layout">
      <SchemaSqlPanel
        sql={sql}
        onSqlChange={setSql}
        onLoad={() => void loadSchema()}
        loading={loading}
        error={error}
        tableCount={tables.length}
        title="Your Schema"
        description="Paste CREATE TABLE SQL to generate the ER diagram. Independent from the playground."
      />

      <div className="independent-main erd-independent-main">
        {diagramSql ? (
          <div className="erd-wrapper">
            <SchemaVisualizer initialSql={diagramSql} embedded />
          </div>
        ) : (
          <div className="independent-empty">
            <p>Paste your schema SQL and click Create Database to visualize relationships.</p>
          </div>
        )}
      </div>
    </div>
  );
}
