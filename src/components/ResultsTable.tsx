import { For, Show, createSignal, onMount, Accessor } from "solid-js";
import { QueryResult } from "../types.ts";
import { 
  formatValueForDisplay, 
  resultsToJson, 
  resultsToCsv, 
  copyToClipboard, 
  downloadFile 
} from "../utils.ts";
import { themeColors } from "../utils/theme.ts";
import { ThemeMode } from "../types/theme.ts";

interface ResultsTableProps {
  results: QueryResult | null;
  onRowSelect: (row: unknown[], index: number) => void;
  selectedRowIndex: number | null;
  onToggleDetailSidebar: () => void;
  detailSidebarOpen: boolean;
  theme: ThemeMode;
  fontSize: string;
  fontFamily: string;
}

export const ResultsTable = (props: ResultsTableProps) => {
  const [isFocused, setIsFocused] = createSignal(false);
  const [actionMessage, setActionMessage] = createSignal<{ text: string; type: 'success' | 'error' } | null>(null);
  
  // Create a ref for the table container
  let tableContainerRef: HTMLDivElement | undefined;
  
  // Expose the table container ref to the global scope for keyboard shortcuts
  onMount(() => {
    if (typeof globalThis !== 'undefined') {
      (globalThis as { resultsTableContainer?: HTMLDivElement }).resultsTableContainer = tableContainerRef;
    }
  });

  // Get the appropriate data to export/copy based on the sidebar state
  const getDataToUse = () => {
    if (!props.results) return null;
    
    // If detail sidebar is open and a row is selected, only use that row
    if (props.detailSidebarOpen && props.selectedRowIndex !== null) {
      return [props.results.rows[props.selectedRowIndex]];
    }
    
    // Otherwise use all rows
    return props.results.rows;
  };

  // Handle export action
  const handleExport = () => {
    if (!props.results) return;
    
    try {
      const rowsToExport = getDataToUse();
      if (!rowsToExport) return;
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Default to JSON format
      const jsonData = resultsToJson(rowsToExport);
      downloadFile(jsonData, `query-results-${timestamp}.json`, 'application/json');
      
      const message = props.detailSidebarOpen && props.selectedRowIndex !== null
        ? 'Selected row exported as JSON'
        : 'Results exported as JSON';
      
      setActionMessage({ text: message, type: 'success' });
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.error('Export error:', err);
      setActionMessage({ text: `Export failed: ${err instanceof Error ? err.message : String(err)}`, type: 'error' });
      setTimeout(() => setActionMessage(null), 3000);
    }
  };
  
  // Handle copy action
  const handleCopy = async () => {
    if (!props.results) return;
    
    try {
      const rowsToCopy = getDataToUse();
      if (!rowsToCopy) return;
      
      // Default to JSON format
      const jsonData = resultsToJson(rowsToCopy);
      await copyToClipboard(jsonData);
      
      const message = props.detailSidebarOpen && props.selectedRowIndex !== null
        ? 'Selected row copied as JSON'
        : 'Results copied as JSON';
      
      setActionMessage({ text: message, type: 'success' });
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.error('Copy error:', err);
      setActionMessage({ text: `Copy failed: ${err instanceof Error ? err.message : String(err)}`, type: 'error' });
      setTimeout(() => setActionMessage(null), 3000);
    }
  };
  
  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent) => {
    // Only handle shortcuts when focused
    if (!isFocused()) return;
    
    // Ctrl+C to copy
    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      handleCopy();
    }
    
    // Ctrl+E to export/save (changed from Ctrl+S)
    if (e.ctrlKey && e.key === 'e') {
      e.preventDefault();
      handleExport();
    }
  };
  
  return (
    <div 
      ref={tableContainerRef}
      class={`results-table border ${isFocused() ? `border-blue-500 ring-2 ${themeColors[props.theme].focusRing}` : themeColors[props.theme].border} rounded-md overflow-hidden mt-4 flex-1 flex flex-col`}
      tabIndex={0}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onKeyDown={handleKeyDown}
    >
      <div class="overflow-x-auto flex-1">
        <Show when={props.results} fallback={<div class={`p-4 ${themeColors[props.theme].subText}`}>No results to display</div>}>
          {(results: Accessor<QueryResult>) => (
            <table 
              class={`min-w-full divide-y ${themeColors[props.theme].divider}`}
              style={{
                "font-family": props.fontFamily,
                "font-size": `${props.fontSize}px`
              }}
            >
              <thead class={themeColors[props.theme].tableHead}>
                <tr>
                  <For each={results().columns}>
                    {(column) => (
                      <th class={`px-6 py-3 text-left font-medium ${themeColors[props.theme].subText} uppercase tracking-wider`}>
                        {column}
                      </th>
                    )}
                  </For>
                </tr>
              </thead>
              <tbody class={`${themeColors[props.theme].tableRow} divide-y ${themeColors[props.theme].divider}`}>
                <For each={results().rows}>
                  {(row, index) => (
                    <tr 
                      class={`${themeColors[props.theme].tableRowHover} cursor-pointer ${props.selectedRowIndex === index() ? `${themeColors[props.theme].tableRowSelected} ring-2 ${themeColors[props.theme].focusRing}` : ''}`}
                      onClick={() => {
                        props.onRowSelect(row, index());
                        setIsFocused(true);
                        if (tableContainerRef) {
                          tableContainerRef.focus();
                        }
                      }}
                    >
                      <For each={row}>
                        {(value) => (
                          <td class={`px-6 py-4 whitespace-nowrap ${themeColors[props.theme].subText}`}>
                            {formatValueForDisplay(value)}
                          </td>
                        )}
                      </For>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          )}
        </Show>
      </div>
      
      {/* Action buttons at bottom */}
      <Show when={props.results && props.results.rows.length > 0}>
        <div class={`flex items-center justify-between px-4 py-2 ${themeColors[props.theme].tableHead} border-t ${themeColors[props.theme].border}`}>
          <div class="flex items-center space-x-2">
            {/* Action buttons moved to the left */}
            <button
              type="button"
              onClick={props.onToggleDetailSidebar}
              class={`flex items-center text-sm px-2 py-1 ${themeColors[props.theme].buttonBg} ${themeColors[props.theme].buttonHover} rounded`}
            >
              <span class="material-icons text-sm mr-1">{props.detailSidebarOpen ? 'visibility_off' : 'visibility'}</span>
            </button>
            
            {/* Export button */}
            <button
              type="button"
              onClick={handleExport}
              class={`flex items-center text-sm px-3 py-1 ${themeColors[props.theme].buttonBg} ${themeColors[props.theme].buttonHover} rounded`}
              title="Export results as JSON (Ctrl+E)"
            >
              <span class="material-icons text-sm mr-1">download</span>
            </button>
            
            {/* Copy button */}
            <button
              type="button"
              onClick={handleCopy}
              class={`flex items-center text-sm px-3 py-1 ${themeColors[props.theme].buttonBg} ${themeColors[props.theme].buttonHover} rounded`}
              title="Copy results as JSON (Ctrl+C)"
            >
              <span class="material-icons text-sm mr-1">content_copy</span>
            </button>
          
            <div class="flex items-center space-x-2">
              <h3 class="font-medium">Found</h3>
              <Show when={props.results}>
                <span>{props.results?.rows.length} rows</span>
              </Show>
            </div>
            
            {/* Action message toast */}
            <Show when={actionMessage()}>
              <div 
                class={`px-3 py-1 rounded text-sm ${
                  actionMessage()?.type === 'success' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}
              >
                {actionMessage()?.text}
              </div>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default ResultsTable; 