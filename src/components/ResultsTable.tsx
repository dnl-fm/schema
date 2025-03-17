import { For, Show, createSignal, onMount } from "solid-js";
import { QueryResult } from "../types.ts";
import { formatValueForDisplay } from "../utils.ts";

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
  
  // Create a ref for the table container
  let tableContainerRef: HTMLDivElement | undefined;
  
  // Expose the table container ref to the global scope for keyboard shortcuts
  onMount(() => {
    if (typeof window !== 'undefined') {
      (window as any).resultsTableContainer = tableContainerRef;
    }
  });
  
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
          {(results) => (
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
            <h3 class="font-medium">Results:</h3>
            <Show when={props.results}>
              <span>{props.results?.rows.length} rows</span>
            </Show>
          </div>
          <div class="flex space-x-2">
            <button
              onClick={props.onToggleDetailSidebar}
              class={`flex items-center text-sm px-2 py-1 ${props.theme === 'dark' ? 'bg-black hover:bg-gray-900 border border-gray-800' : 'bg-gray-200 hover:bg-gray-300'} rounded`}
            >
              <span class="material-icons text-sm mr-1">{props.detailSidebarOpen ? 'visibility_off' : 'visibility'}</span>
              {props.detailSidebarOpen ? 'Hide Details' : 'Show Details'}
            </button>
            <button
              class={`flex items-center text-sm px-3 py-1 ${props.theme === 'dark' ? 'bg-black hover:bg-gray-900 border border-gray-800' : 'bg-gray-200 hover:bg-gray-300'} rounded`}
              title="Export results"
            >
              <span class="material-icons text-sm mr-1">download</span>
              Export
            </button>
            <button
              class={`flex items-center text-sm px-3 py-1 ${props.theme === 'dark' ? 'bg-black hover:bg-gray-900 border border-gray-800' : 'bg-gray-200 hover:bg-gray-300'} rounded`}
              title="Copy as JSON"
            >
              <span class="material-icons text-sm mr-1">content_copy</span>
              Copy
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default ResultsTable; 