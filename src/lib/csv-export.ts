// Lightweight CSV export helpers — no external dependencies.

function escapeCell(value: any): string {
  if (value === null || value === undefined) return '';
  let str: string;
  if (value instanceof Date) str = value.toISOString();
  else if (typeof value === 'object') str = JSON.stringify(value);
  else str = String(value);
  if (/[",\n\r]/.test(str)) str = `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function toCSV(rows: Record<string, any>[], columns?: string[]): string {
  if (rows.length === 0) return '';
  const cols = columns ?? Array.from(new Set(rows.flatMap(r => Object.keys(r))));
  const header = cols.map(escapeCell).join(',');
  const body = rows.map(r => cols.map(c => escapeCell(r[c])).join(',')).join('\n');
  return `${header}\n${body}`;
}

export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const stamp = new Date().toISOString().slice(0, 10);
  link.download = filename.replace('.csv', `_${stamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
