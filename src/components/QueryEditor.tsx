import { createSignal, createEffect, onMount } from "solid-js";
import { themeColors } from "../utils/theme.ts";
import { ThemeMode } from "../types/theme.ts";

interface QueryEditorProps {
  onExecuteQuery: (query: string) => void;
  isLoading: boolean;
  selectedTable: string;
  theme: ThemeMode;
  fontSize: string;
  fontFamily: string;
}

export const QueryEditor = (props: QueryEditorProps) => {
  const [query, setQuery] = createSignal("");
  const [isFocused, setIsFocused] = createSignal(false);
  
  // Create a ref for the textarea
  let textareaRef: HTMLTextAreaElement | undefined;

  // Update query when selected table changes
  createEffect(() => {
    if (props.selectedTable) {
      setQuery(`SELECT * FROM ${props.selectedTable} LIMIT 100`);
    }
  });

  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent) => {
    // Execute query on Ctrl+Enter
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      if (!props.isLoading) {
        props.onExecuteQuery(query());
      }
    }
  };
  
  // Expose the textarea ref to the global scope for keyboard shortcuts
  onMount(() => {
    if (typeof globalThis !== 'undefined') {
      (globalThis as any).queryEditorTextarea = textareaRef;
    }
  });

  // Get button color based on theme
  const getRunButtonClasses = () => {
    // Common button styles for all themes
    return `px-3 py-1 text-white rounded disabled:opacity-50 ${themeColors[props.theme].primaryButtonBg} ${themeColors[props.theme].primaryButtonHover}`;
  };

  return (
    <div class={`query-editor flex flex-col h-64 border ${isFocused() ? `border-blue-500 ring-2 ${themeColors[props.theme].focusRing}` : themeColors[props.theme].border} rounded-md`}>
      <div class={`flex justify-between items-center px-4 py-2 ${themeColors[props.theme].tableHead} border-b ${themeColors[props.theme].border}`}>
        <h3 class="font-medium">SQL Query</h3>
        <div class="flex items-center">
          <button 
            onClick={() => props.onExecuteQuery(query())}
            disabled={props.isLoading}
            class={getRunButtonClasses()}
          >
            {props.isLoading ? "Running..." : "Run"}
          </button>
        </div>
      </div>
      <textarea 
        ref={textareaRef}
        value={query()} 
        onInput={(e) => setQuery(e.currentTarget.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        class={`flex-1 p-4 resize-none focus:outline-none ${themeColors[props.theme].inputBg} ${themeColors[props.theme].text}`}
        style={{
          "font-family": props.fontFamily,
          "font-size": `${props.fontSize}px`
        }}
        placeholder="Enter SQL query..."
      />
    </div>
  );
};

export default QueryEditor; 