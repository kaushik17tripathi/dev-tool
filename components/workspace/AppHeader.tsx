"use client";

import {
  Database,
  GitBranch,
  LayoutGrid,
  Moon,
  PenTool,
  Play,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useWorkspace, type WorkspaceView } from "@/context/WorkspaceContext";

const NAV_ITEMS: { id: WorkspaceView; label: string; icon: typeof Database }[] = [
  { id: "playground", label: "Playground", icon: Play },
  { id: "query-builder", label: "Query Builder", icon: GitBranch },
  { id: "erd", label: "ER Diagram", icon: LayoutGrid },
  { id: "schema-designer", label: "Schema Designer", icon: PenTool },
];

export default function AppHeader() {
  const { activeView, setActiveView } = useWorkspace();
  const { theme, setTheme } = useTheme();

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">
          <Database size={19} strokeWidth={2.2} />
        </div>
        <div>
          <div className="brand-name">
            SQL <span>Workspace</span>
          </div>
          <p>Local-first database tool</p>
        </div>
      </div>

      <nav className="nav-tabs" aria-label="Workspace views">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={activeView === item.id ? "nav-tab active" : "nav-tab"}
              onClick={() => setActiveView(item.id)}
            >
              <Icon size={14} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="topbar-actions">
        <button
          className="quiet-button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          {theme === "dark" ? "Light" : "Dark"}
        </button>
        <div className="privacy-pill">
          <ShieldCheck size={14} />
          100% browser-only
        </div>
      </div>
    </header>
  );
}
