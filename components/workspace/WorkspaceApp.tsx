"use client";

import { useWorkspace } from "@/context/WorkspaceContext";
import AppHeader from "@/components/workspace/AppHeader";
import PlaygroundView from "@/components/playground/PlaygroundView";
import QueryBuilderView from "@/components/query-builder/QueryBuilderView";
import ERDiagramView from "@/components/erd/ERDiagramView";
import SchemaDesignerView from "@/components/schema-designer/SchemaDesignerView";

export default function WorkspaceApp() {
  const { ready, activeView } = useWorkspace();

  if (!ready) {
    return (
      <div className="loading-shell">
        <div className="loading-spinner" />
        <p>Loading SQL engine...</p>
      </div>
    );
  }

  return (
    <div className="workspace-app">
      <AppHeader />
      <main className="workspace-content">
        {activeView === "playground" && <PlaygroundView />}
        {activeView === "query-builder" && <QueryBuilderView />}
        {activeView === "erd" && <ERDiagramView />}
        {activeView === "schema-designer" && <SchemaDesignerView />}
      </main>
    </div>
  );
}
