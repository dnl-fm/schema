// Theme utility functions and constants for SQLite Explorer
import { ThemeMode, ThemeColors, SyntaxHighlightColors, ThemeConfig, ThemeRegistry } from '../types/theme.ts';

// Theme color palettes - customized to be more comfortable
export const themeColors: Record<ThemeMode, ThemeColors> = {
  light: {
    // Less bright light theme
    background: 'bg-gray-50', // slightly gray instead of pure white
    text: 'text-gray-800',    // slightly darker text for better contrast
    border: 'border-gray-300',
    divider: 'divide-gray-200',
    hover: 'hover:bg-gray-100',
    tableHead: 'bg-gray-100',
    tableRow: 'bg-gray-50',
    tableRowHover: 'hover:bg-gray-200',
    tableRowSelected: 'bg-blue-50',
    inputBg: 'bg-white',
    sidebar: 'bg-gray-100',
    sidebarBorder: 'border-gray-200',
    buttonBg: 'bg-gray-200',
    buttonHover: 'hover:bg-gray-300',
    primaryButtonBg: 'bg-blue-600',
    primaryButtonHover: 'hover:bg-blue-700',
    focusRing: 'ring-blue-400',
    headerText: 'text-gray-700',
    subText: 'text-gray-500',
  },
  dark: {
    // Less dark theme
    background: 'bg-gray-900', // dark gray instead of pure black
    text: 'text-gray-200',     // lighter text for better readability
    border: 'border-gray-700', 
    divider: 'divide-gray-700',
    hover: 'hover:bg-gray-800',
    tableHead: 'bg-gray-800',
    tableRow: 'bg-gray-900',
    tableRowHover: 'hover:bg-gray-800',
    tableRowSelected: 'bg-blue-900',
    inputBg: 'bg-gray-800',
    sidebar: 'bg-gray-800',
    sidebarBorder: 'border-gray-700',
    buttonBg: 'bg-gray-700',
    buttonHover: 'hover:bg-gray-600',
    primaryButtonBg: 'bg-blue-700',
    primaryButtonHover: 'hover:bg-blue-600',
    focusRing: 'ring-blue-500',
    headerText: 'text-gray-300',
    subText: 'text-gray-400',
  },
  tokyo: {
    // Tokyo theme inspired by Insomnia
    background: 'bg-slate-900',    // dark blue-gray background
    text: 'text-slate-200',        // light text for readability
    border: 'border-slate-700',    // subtle borders
    divider: 'divide-slate-700',
    hover: 'hover:bg-slate-800',
    tableHead: 'bg-slate-800',     // slightly lighter header
    tableRow: 'bg-slate-900',
    tableRowHover: 'hover:bg-slate-800',
    tableRowSelected: 'bg-indigo-900',  // purple-ish highlight
    inputBg: 'bg-slate-800',
    sidebar: 'bg-slate-900',
    sidebarBorder: 'border-slate-700',
    buttonBg: 'bg-slate-700',
    buttonHover: 'hover:bg-slate-600',
    primaryButtonBg: 'bg-purple-600',
    primaryButtonHover: 'hover:bg-purple-500',
    focusRing: 'ring-purple-500',
    headerText: 'text-slate-300',
    subText: 'text-slate-400',
  }
};

// Syntax highlighting colors for each theme
export const syntaxColors: Record<ThemeMode, SyntaxHighlightColors> = {
  light: {
    string: 'text-purple-600',
    key: 'text-red-600',
    boolean: 'text-blue-600',
    null: 'text-gray-600',
    number: 'text-green-600'
  },
  dark: {
    string: 'text-purple-300',
    key: 'text-red-300',
    boolean: 'text-blue-300',
    null: 'text-gray-400',
    number: 'text-green-300'
  },
  tokyo: {
    string: 'text-emerald-400',  // Green strings
    key: 'text-sky-400',         // Blue-ish keys
    boolean: 'text-amber-400',   // Yellow-ish booleans
    null: 'text-slate-400',      // Gray nulls
    number: 'text-rose-400'      // Red-ish numbers
  }
};

// Complete theme configurations
export const themes: ThemeRegistry = {
  light: {
    colors: themeColors.light,
    syntax: syntaxColors.light
  },
  dark: {
    colors: themeColors.dark,
    syntax: syntaxColors.dark
  },
  tokyo: {
    colors: themeColors.tokyo,
    syntax: syntaxColors.tokyo
  }
};

// Helper function to get theme classes
export function getThemeClass(theme: ThemeMode, element: keyof ThemeColors): string {
  return themeColors[theme][element];
}

// Get syntax highlighting color for a theme
export function getSyntaxColor(theme: ThemeMode, element: keyof SyntaxHighlightColors): string {
  return syntaxColors[theme][element];
}

// Get the complete theme configuration
export function getTheme(themeName: ThemeMode): ThemeConfig {
  return themes[themeName];
}

// Helper function to generate complete theme class combinations for common elements
export function getComponentTheme(theme: ThemeMode, component: 'table' | 'sidebar' | 'input' | 'button' | 'card'): Record<string, string> {
  switch (component) {
    case 'table':
      return {
        container: `${themeColors[theme].border} border rounded-md overflow-hidden`,
        header: themeColors[theme].tableHead,
        divider: themeColors[theme].divider,
        row: themeColors[theme].tableRow,
        rowHover: themeColors[theme].tableRowHover,
        text: themeColors[theme].text,
      };
    case 'sidebar':
      return {
        container: `${themeColors[theme].sidebar} ${themeColors[theme].sidebarBorder} border-r`,
        divider: `${themeColors[theme].sidebarBorder} border-b`,
        text: themeColors[theme].text,
      };
    case 'input':
      return {
        container: `${themeColors[theme].inputBg} ${themeColors[theme].border} border rounded`,
        text: themeColors[theme].text,
        focus: themeColors[theme].focusRing,
      };
    case 'button':
      return {
        base: `${themeColors[theme].buttonBg} ${themeColors[theme].buttonHover}`,
        text: themeColors[theme].text,
      };
    case 'card':
      return {
        container: `${themeColors[theme].background} ${themeColors[theme].border} border rounded-lg shadow`,
        text: themeColors[theme].text,
      };
    default:
      return {};
  }
} 