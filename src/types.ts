import { ThemeMode } from './types/theme.ts';

export interface TableRow {
  name: string;
  [key: string]: unknown;
}

export type DatabaseType = 'sqlite' | 'libsql';

export interface DatabaseConfig {
  type: DatabaseType;
  path?: string;  // For SQLite
  url?: string;   // For LibSQL
  authToken?: string; // For LibSQL
}

export interface QueryResult {
  columns: string[];
  rows: unknown[][];
  rowCount: number;
  error?: string;
}

export interface ConnectionHistory {
  name: string;  // path for SQLite, url for LibSQL
  type: 'sqlite' | 'libsql';
  meta: string;  // JSON string containing type-specific properties
  lastAccessed: number;
  saved?: boolean; // Flag indicating if this is a saved connection
}

export interface AppSettings {
  theme: ThemeMode;
  fontSize: string;
  fontFamily: string;
}

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
}

export interface ColumnInfo {
  name: string;
  type: string;
  notnull: number;
  dflt_value: unknown;
  pk: number;
}

export interface QueryHistory {
  sql: string;
  timestamp: number;
  duration: number;
  error?: string;
  rowCount?: number;
}

export interface ResultsTableProps {
  results: QueryResult | null;
  onRowSelect: (row: unknown[], index: number) => void;
  selectedRowIndex: number | null;
  onToggleDetailSidebar: () => void;
  detailSidebarOpen: boolean;
  theme: ThemeMode;
  fontSize: string;
  fontFamily: string;
}

export interface RowDetailSidebarProps {
  row: Record<string, unknown> | null;
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
}

export interface ConnectionDialogProps {
  dbPath: string;
  onDbPathChange: (path: string) => void;
  libsqlUrl: string;
  onLibsqlUrlChange: (url: string) => void;
  authToken: string;
  onAuthTokenChange: (token: string) => void;
  connectionType: DatabaseType;
  onConnectionTypeChange: (type: DatabaseType) => void;
  onConnect: (options?: { saveOnly?: boolean }) => void;
  isLoading: boolean;
  isConnected: boolean;
  isEditing?: boolean;
  theme: ThemeMode;
  savedConnections: ConnectionHistory[];
  recentConnections: ConnectionHistory[];
  onSelectRecent: (connection: ConnectionHistory) => void;
  onRemoveConnection: (connection: ConnectionHistory) => void;
  onEditConnection: (connection: ConnectionHistory) => void;
  isOpen: boolean;
  onClose: () => void;
} 