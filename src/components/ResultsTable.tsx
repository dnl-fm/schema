import { For, Show, createSignal, onMount, Accessor } from "solid-js";
import { QueryResult } from "../types.ts";
import { 
  formatValueForDisplay, 
  resultsToJson, 
  resultsToCsv, 
  copyToClipboard, 
  downloadFile 
} from "../utils.ts";

interface ResultsTableProps {
  results: QueryResult | null;
  onRowSelect: (row: Record<string, unknown>) => void;
  selectedRowIndex: number | null;
  onToggleDetailSidebar: () => void;
  detailSidebarOpen: boolean;
  theme: 'light' | 'dark';
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
    if (typeof window !== 'undefined') {
      (window as any).resultsTableContainer = tableContainerRef;
    }
  });

  // Handle export action
  const handleExport = () => {
    if (!props.results) return;
    
    try {
      const { columns, rows } = props.results;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Default to JSON format
      const jsonData = resultsToJson(rows);
      downloadFile(jsonData, `query-results-${timestamp}.json`, 'application/json');
      
      setActionMessage({ text: `Results exported as JSON`, type: 'success' });
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
      const { rows } = props.results;
      
      // Default to JSON format
      const jsonData = resultsToJson(rows);
      await copyToClipboard(jsonData);
      
      setActionMessage({ text: `Results copied as JSON`, type: 'success' });
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.error('Copy error:', err);
      setActionMessage({ text: `Copy failed: ${err instanceof Error ? err.message : String(err)}`, type: 'error' });
      setTimeout(() => setActionMessage(null), 3000);
    }
  };
  
  return (
    <div 
      ref={tableContainerRef}
      class={`results-table border ${isFocused() ? (props.theme === 'dark' ? 'border-blue-500 ring-2 ring-blue-500' : 'border-blue-400 ring-2 ring-blue-400') : (props.theme === 'dark' ? 'border-gray-800' : 'border-gray-300')} rounded-md overflow-hidden mt-4 flex-1 flex flex-col`}
      tabIndex={0}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      <div class="overflow-x-auto flex-1">
        <Show when={props.results} fallback={<div class={`p-4 ${props.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>No results to display</div>}>
          {(results: Accessor<QueryResult>) => (
            <table 
              class={`min-w-full divide-y ${props.theme === 'dark' ? 'divide-gray-800' : 'divide-gray-200'}`}
              style={{
                "font-family": props.fontFamily,
                "font-size": `${props.fontSize}px`
              }}
            >
              <thead class={props.theme === 'dark' ? 'bg-black' : 'bg-gray-50'}>
                <tr>
                  <For each={results().columns}>
                    {(column) => (
                      <th class={`px-6 py-3 text-left font-medium ${props.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                        {column}
                      </th>
                    )}
                  </For>
                </tr>
              </thead>
              <tbody class={`${props.theme === 'dark' ? 'bg-black' : 'bg-white'} divide-y ${props.theme === 'dark' ? 'divide-gray-800' : 'divide-gray-200'}`}>
                <For each={results().rows}>
                  {(row, index) => (
                    <tr 
                      class={`${props.theme === 'dark' ? 'hover:bg-gray-900' : 'hover:bg-gray-50'} cursor-pointer ${props.selectedRowIndex === index() ? (props.theme === 'dark' ? 'bg-blue-800 ring-2 ring-blue-500' : 'bg-blue-50 ring-2 ring-blue-400') : ''}`}
                      onClick={() => {
                        props.onRowSelect(row);
                        setIsFocused(true);
                        if (tableContainerRef) {
                          tableContainerRef.focus();
                        }
                      }}
                    >
                      <For each={results().columns}>
                        {(column) => {
                          const value = row[column];
                          
                          return (
                            <td class={`px-6 py-4 whitespace-nowrap ${props.theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                              {formatValueForDisplay(value)}
                            </td>
                          );
                        }}
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
        <div class={`flex items-center justify-between px-4 py-2 ${props.theme === 'dark' ? 'bg-black border-gray-800' : 'bg-gray-50 border-gray-200'} border-t`}>
          <div class="flex items-center space-x-2">
            {/* Action buttons moved to the left */}
            <button
              type="button"
              onClick={props.onToggleDetailSidebar}
              class={`flex items-center text-sm px-2 py-1 ${props.theme === 'dark' ? 'bg-black hover:bg-gray-900 border border-gray-800' : 'bg-gray-200 hover:bg-gray-300'} rounded`}
            >
              <span class="material-icons text-sm mr-1">{props.detailSidebarOpen ? 'visibility_off' : 'visibility'}</span>
            </button>
            
            {/* Export button */}
            <button
              type="button"
              onClick={handleExport}
              class={`flex items-center text-sm px-3 py-1 ${props.theme === 'dark' ? 'bg-black hover:bg-gray-900 border border-gray-800' : 'bg-gray-200 hover:bg-gray-300'} rounded`}
              title="Export results as JSON"
            >
              <span class="material-icons text-sm mr-1">download</span>
            </button>
            
            {/* Copy button */}
            <button
              type="button"
              onClick={handleCopy}
              class={`flex items-center text-sm px-3 py-1 ${props.theme === 'dark' ? 'bg-black hover:bg-gray-900 border border-gray-800' : 'bg-gray-200 hover:bg-gray-300'} rounded`}
              title="Copy results as JSON"
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
                    ? (props.theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800') 
                    : (props.theme === 'dark' ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800')
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