export interface TableRow {
  name: string;
  [key: string]: unknown;
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
}

export interface ConnectionHistory {
  id?: number;
  path: string;
  last_used: string;
}

export interface AppSettings {
  fontSize: string;
  fontFamily: string;
  theme: 'light' | 'dark';
} 