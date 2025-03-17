// Theme type definitions for SQLite Explorer

// The available theme modes
export type ThemeMode = 'light' | 'dark' | 'tokyo';

// Common interface for all theme color objects
export interface ThemeColors {
  background: string;
  text: string;
  border: string;
  divider: string;
  hover: string;
  tableHead: string;
  tableRow: string;
  tableRowHover: string;
  tableRowSelected: string;
  inputBg: string;
  sidebar: string;
  sidebarBorder: string;
  buttonBg: string;
  buttonHover: string;
  primaryButtonBg: string;
  primaryButtonHover: string;
  focusRing: string;
  headerText: string;
  subText: string;
}

// Interface for syntax highlighting colors
export interface SyntaxHighlightColors {
  string: string;
  key: string;
  boolean: string;
  null: string;
  number: string;
}

// Complete theme configuration including colors and syntax highlighting
export interface ThemeConfig {
  colors: ThemeColors;
  syntax: SyntaxHighlightColors;
}

// Map of theme names to their configurations
export interface ThemeRegistry {
  [key: string]: ThemeConfig;
} 