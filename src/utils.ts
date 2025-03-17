import { ThemeMode, SyntaxHighlightColors } from './types/theme.ts';
import { getSyntaxColor } from './utils/theme.ts';

// Helper function to check if a value is JSON or JSON-like string
export function isJsonLike(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  
  // If it's already an object or array
  if (typeof value === 'object') return true;
  
  // If it's a string that looks like JSON
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) || 
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    );
  }
  
  return false;
}

// Helper function to parse JSON-like values
export function parseJsonValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  
  // If it's already an object, return it
  if (typeof value === 'object') return value;
  
  // If it's a string that looks like JSON, try to parse it
  if (typeof value === 'string') {
    try {
      const trimmed = value.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
          (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        return JSON.parse(trimmed);
      }
    } catch (e) {
      // If parsing fails, return the original string
    }
  }
  
  return value;
}

// Format a value for display in the table
export function formatValueForDisplay(value: unknown): string {
  if (value === null || value === undefined) return '';
  
  // Always return the string representation, even for JSON
  return String(value);
}

// Check if a string is likely to be JSON for highlighting
export function isJsonString(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) || 
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    );
  }
  
  return false;
}

// Syntax highlight JSON
export function syntaxHighlightJson(json: string, theme: ThemeMode): string {
  // Get a class prefix for special themes
  const getThemePrefix = (themeMode: ThemeMode, type: keyof SyntaxHighlightColors): string => {
    if (themeMode === 'tokyo') {
      return `tokyo-highlight-${type} `;
    }
    return '';
  };

  // Replace with syntax highlighting
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, 
    function (match) {
      let type: keyof SyntaxHighlightColors = 'string';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          type = 'key';
        }
      } else if (/true|false/.test(match)) {
        type = 'boolean';
      } else if (/null/.test(match)) {
        type = 'null';
      } else {
        type = 'number';
      }
      
      const cls = getSyntaxColor(theme, type);
      const prefix = getThemePrefix(theme, type);
      
      return `<span class="${prefix}${cls}">${match}</span>`;
    }
  );
}

// Convert query results to JSON string
export function resultsToJson(rows: Record<string, unknown>[]): string {
  return JSON.stringify(rows, null, 2);
}

// Convert query results to CSV string
export function resultsToCsv(columns: string[], rows: Record<string, unknown>[]): string {
  // Create header row
  const header = columns.join(',');
  
  // Create data rows
  const dataRows = rows.map(row => {
    return columns.map(column => {
      const value = row[column];
      
      // Handle null and undefined
      if (value === null || value === undefined) {
        return '';
      }
      
      // Convert to string and handle commas by quoting
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        // Escape quotes by doubling them and wrap in quotes
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    }).join(',');
  });
  
  // Combine header and data rows
  return [header, ...dataRows].join('\n');
}

// Copy text to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
}

// Download data as a file
export function downloadFile(data: string, filename: string, mimeType: string): void {
  // Create a blob with the data
  const blob = new Blob([data], { type: mimeType });
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create a temporary link element
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // Append to the document
  document.body.appendChild(link);
  
  // Trigger the download
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
} 