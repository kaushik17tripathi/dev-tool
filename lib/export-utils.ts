import * as XLSX from "xlsx";
import { queryResultToCsv } from "./csv-utils";

export function downloadText(content: string, filename: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export function downloadBytes(bytes: Uint8Array, filename: string, mime: string) {
  const blob = new Blob([toArrayBuffer(bytes)], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportResultAsCsv(columns: string[], rows: unknown[][], filename = "results.csv") {
  downloadText(queryResultToCsv(columns, rows), filename, "text/csv");
}

export function exportResultAsJson(columns: string[], rows: unknown[][], filename = "results.json") {
  const data = rows.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
  downloadText(JSON.stringify(data, null, 2), filename, "application/json");
}

export function exportResultAsExcel(columns: string[], rows: unknown[][], filename = "results.xlsx") {
  const data = rows.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Results");
  const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  downloadBytes(new Uint8Array(buffer), filename, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}

export async function parseExcelFile(file: File): Promise<{ name: string; text: string }[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  return wb.SheetNames.map((sheetName) => {
    const sheet = wb.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    return { name: sheetName, text: csv };
  });
}

export async function parseJsonFile(file: File): Promise<Record<string, unknown>[]> {
  const text = await file.text();
  const data = JSON.parse(text);
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") return [data as Record<string, unknown>];
  throw new Error("JSON must be an array or object.");
}

export function jsonToCsv(data: Record<string, unknown>[]): string {
  if (!data.length) return "";
  const headers = Object.keys(data[0]);
  const lines = [headers.join(",")];
  for (const row of data) {
    lines.push(
      headers
        .map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return "";
          const str = String(val);
          return str.includes(",") ? `"${str.replace(/"/g, '""')}"` : str;
        })
        .join(","),
    );
  }
  return lines.join("\n");
}
