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
export function syntaxHighlightJson(json: string, theme: 'light' | 'dark'): string {
  // Replace with syntax highlighting
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, 
    function (match) {
      let cls = theme === 'dark' ? 'text-purple-400' : 'text-purple-600'; // string (purple)
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = theme === 'dark' ? 'text-red-400' : 'text-red-600'; // key (red)
        }
      } else if (/true|false/.test(match)) {
        cls = theme === 'dark' ? 'text-blue-400' : 'text-blue-600'; // boolean (blue)
      } else if (/null/.test(match)) {
        cls = theme === 'dark' ? 'text-gray-400' : 'text-gray-600'; // null (gray)
      } else {
        cls = theme === 'dark' ? 'text-green-400' : 'text-green-600'; // number (green)
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
} 