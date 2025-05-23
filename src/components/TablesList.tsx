import { For, Show, createSignal, onMount, onCleanup } from "solid-js";
import { themeColors } from "../utils/theme.ts";
import { ThemeMode } from "../types/theme.ts";

interface TablesListProps {
  tables: string[];
  selectedTable: string;
  onSelectTable: (table: string, triggerQueryExecution: boolean) => void;
  theme: ThemeMode;
  isVisible: boolean;
}

export const TablesList = (props: TablesListProps) => {
  const [focusedIndex, setFocusedIndex] = createSignal(-1);
  const [isFocused, setIsFocused] = createSignal(false);
  
  // Reference to the container element
  let containerRef: HTMLDivElement | undefined;
  
  // Handler for the custom event
  const handleUpdateFocusedTable = (e: CustomEvent) => {
    if (e.detail && e.detail.selectedTable) {
      const index = props.tables.findIndex(t => t === e.detail.selectedTable);
      if (index >= 0) {
        setFocusedIndex(index);
        // Scroll to ensure the item is visible
        setTimeout(() => scrollToTable(index), 50);
      } else if (props.tables.length > 0) {
        // If the selected table isn't found, focus the first table
        setFocusedIndex(0);
        setTimeout(() => scrollToTable(0), 50);
      }
    }
  };
  
  // Expose the container ref to the global scope for keyboard shortcuts
  onMount(() => {
    if (typeof globalThis !== 'undefined') {
      (globalThis as any).tablesListContainer = containerRef;
      
      // Add event listener for the custom event
      globalThis.addEventListener('update-focused-table', handleUpdateFocusedTable as EventListener);
    }
    
    // Initialize focused index based on selected table
    updateFocusedIndex();
  });
  
  // Clean up event listeners when component unmounts
  onCleanup(() => {
    if (typeof globalThis !== 'undefined') {
      globalThis.removeEventListener('update-focused-table', handleUpdateFocusedTable as EventListener);
    }
  });
  
  // Update focused index when tables or selectedTable change
  const updateFocusedIndex = () => {
    const currentTableIndex = props.tables.findIndex(t => t === props.selectedTable);
    if (currentTableIndex >= 0) {
      setFocusedIndex(currentTableIndex);
    } else if (props.tables.length > 0) {
      setFocusedIndex(0);
    }
  };
  
  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!props.tables.length) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => {
          const nextIndex = prev < props.tables.length - 1 ? prev + 1 : prev;
          scrollToTable(nextIndex);
          return nextIndex;
        });
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => {
          const nextIndex = prev > 0 ? prev - 1 : 0;
          scrollToTable(nextIndex);
          return nextIndex;
        });
        break;
        
      case ' ': // Spacebar
      case 'Enter': // Added Enter key
        e.preventDefault();
        if (focusedIndex() >= 0 && focusedIndex() < props.tables.length) {
          const tableToSelect = props.tables[focusedIndex()];
          
          // Just notify about table selection without triggering query execution
          props.onSelectTable(tableToSelect, false);
          
          // Notify App to focus query editor after selection
          if (typeof globalThis !== 'undefined' && (globalThis as any).focusQueryEditor) {
            setTimeout(() => {
              (globalThis as any).focusQueryEditor();
            }, 100);
          }
        }
        break;
    }
  };
  
  // Scroll to keep the focused item in view
  const scrollToTable = (index: number) => {
    if (!containerRef) return;
    
    const listItem = containerRef.querySelector(`li:nth-child(${index + 1})`) as HTMLElement;
    if (listItem) {
      const containerRect = containerRef.getBoundingClientRect();
      const listItemRect = listItem.getBoundingClientRect();
      
      if (listItemRect.bottom > containerRect.bottom) {
        // Scroll down if the item is below the visible area
        containerRef.scrollTop += listItemRect.bottom - containerRect.bottom;
      } else if (listItemRect.top < containerRect.top) {
        // Scroll up if the item is above the visible area
        containerRef.scrollTop -= containerRect.top - listItemRect.top;
      }
    }
  };
  
  // Update focused index when tables or selectedTable change
  onMount(() => {
    updateFocusedIndex();
  });

  return (
    <Show when={props.isVisible}>
      <div 
        ref={containerRef}
        class={`tables-list w-64 h-full ${themeColors[props.theme].sidebar} border-r ${themeColors[props.theme].sidebarBorder} overflow-y-auto`}
        tabIndex={0}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
      >
        <div class={`p-4 border-b ${themeColors[props.theme].sidebarBorder}`}>
          <h3 class="text-md font-semibold">Tables</h3>
        </div>
        <ul class={`divide-y ${themeColors[props.theme].divider}`}>
          <For each={props.tables}>
            {(table, index) => (
              <li 
                class={`px-4 py-2 cursor-pointer ${themeColors[props.theme].hover} ${
                  props.selectedTable === table ? themeColors[props.theme].tableRowSelected : ''
                } ${focusedIndex() === index() && isFocused() ? `ring-2 ${themeColors[props.theme].focusRing}` : ''}`}
                onClick={() => {
                  props.onSelectTable(table, true);
                  setFocusedIndex(index());
                }}
              >
                <div class="flex items-center">
                  <span class="material-icons text-yellow-500 mr-2 text-sm">table_chart</span>
                  <span class="truncate">{table}</span>
                </div>
              </li>
            )}
          </For>
        </ul>
      </div>
    </Show>
  );
};

export default TablesList; 