"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  Download,
  FileJson,
  FileSpreadsheet,
  Table2,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import type { ResultsController } from "@/hooks/usePlaygroundEditor";
import {
  exportResultAsCsv,
  exportResultAsExcel,
  exportResultAsJson,
} from "@/lib/export-utils";
import { profileDataset } from "@/lib/data-profile";

const CHART_COLORS = ["#6366f1", "#818cf8", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4"];

type ChartType = "table" | "bar" | "line" | "pie";

type ResultsPanelProps = ResultsController;

export default function ResultsPanel({ lastResults, lastError }: ResultsPanelProps) {
  const [chartType, setChartType] = useState<ChartType>("table");
  const [resultIndex, setResultIndex] = useState(0);

  const result = lastResults[resultIndex] ?? null;

  const profile = useMemo(() => {
    if (!result || !result.columns.length) return null;
    return profileDataset(result.columns, result.rows);
  }, [result]);

  const chartData = useMemo(() => {
    if (!result || result.columns.length < 2) return [];
    const [labelCol, ...valueCols] = result.columns;
    return result.rows.slice(0, 50).map((row) => {
      const item: Record<string, unknown> = { label: String(row[0] ?? "") };
      valueCols.forEach((col, i) => {
        item[col] = Number(row[i + 1]) || 0;
      });
      return item;
    });
  }, [result]);

  if (lastError) {
    return (
      <div className="results-panel error-panel">
        <strong>Query error</strong>
        <pre>{lastError}</pre>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="results-panel empty-panel">
        <Table2 size={24} />
        <p>Run a query to see results</p>
      </div>
    );
  }

  const valueCol = result.columns[1] ?? result.columns[0];

  return (
    <div className="results-panel">
      <div className="results-header">
        <div>
          <strong>Results</strong>
          <span>{result.rows.length} rows · {result.durationMs.toFixed(1)}ms</span>
        </div>
        <div className="results-toolbar">
          {lastResults.length > 1 && (
            <select
              value={resultIndex}
              onChange={(e) => setResultIndex(Number(e.target.value))}
            >
              {lastResults.map((_, i) => (
                <option key={i} value={i}>Result set {i + 1}</option>
              ))}
            </select>
          )}
          <div className="chart-type-tabs">
            {(["table", "bar", "line", "pie"] as ChartType[]).map((type) => (
              <button
                key={type}
                className={chartType === type ? "active" : ""}
                onClick={() => setChartType(type)}
              >
                {type}
              </button>
            ))}
          </div>
          <button
            className="quiet-button"
            onClick={() => exportResultAsCsv(result.columns, result.rows)}
          >
            <Download size={13} /> CSV
          </button>
          <button
            className="quiet-button"
            onClick={() => exportResultAsJson(result.columns, result.rows)}
          >
            <FileJson size={13} /> JSON
          </button>
          <button
            className="quiet-button"
            onClick={() => exportResultAsExcel(result.columns, result.rows)}
          >
            <FileSpreadsheet size={13} /> Excel
          </button>
        </div>
      </div>

      {chartType === "table" && (
        <div className="results-table-wrap">
          <table className="results-table">
            <thead>
              <tr>
                {result.columns.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci}>{cell === null ? <em>null</em> : String(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {chartType === "bar" && chartData.length > 0 && (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
              <XAxis dataKey="label" tick={{ fill: "rgb(var(--text-muted))", fontSize: 11 }} />
              <YAxis tick={{ fill: "rgb(var(--text-muted))", fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey={valueCol} fill="rgb(var(--accent))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {chartType === "line" && chartData.length > 0 && (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
              <XAxis dataKey="label" tick={{ fill: "rgb(var(--text-muted))", fontSize: 11 }} />
              <YAxis tick={{ fill: "rgb(var(--text-muted))", fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey={valueCol} stroke="rgb(var(--accent))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {chartType === "pie" && chartData.length > 0 && (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={chartData.slice(0, 8)}
                dataKey={valueCol}
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {chartData.slice(0, 8).map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {profile && chartType === "table" && (
        <details className="profile-panel">
          <summary>
            <BarChart3 size={13} /> Data profiling
          </summary>
          <div className="profile-summary">
            <span>Rows: {profile.rowCount}</span>
            <span>Columns: {profile.columnCount}</span>
            <span>Missing: {profile.missingPercent.toFixed(1)}%</span>
            <span>Duplicate rows: {profile.duplicateRows}</span>
          </div>
          <div className="profile-columns">
            {profile.columns.map((col) => (
              <div key={col.name} className="profile-col-card">
                <strong>{col.name}</strong>
                <span className="col-type">{col.type}</span>
                <div className="col-stats">
                  <span>Unique: {col.unique}</span>
                  <span>Null: {col.nullCount}</span>
                  {col.mean !== undefined && <span>Mean: {col.mean.toFixed(2)}</span>}
                </div>
                {col.topValues.length > 0 && (
                  <div className="top-values">
                    {col.topValues.slice(0, 3).map((v) => (
                      <span key={v.value}>{v.value} ({v.count})</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
