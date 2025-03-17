import { createSignal, onMount, Show, createMemo } from "solid-js";
import { parseJsonValue, syntaxHighlightJson } from "../utils.ts";
import { themeColors } from "../utils/theme.ts";
import { ThemeMode } from "../types/theme.ts";

interface RowDetailSidebarProps {
  row: Record<string, unknown> | null;
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
  fontFamily: string;
  fontSize: string;
  selectedRowIndex: number | null;
}

export const RowDetailSidebar = (props: RowDetailSidebarProps) => {
  const [sidebarWidth, setSidebarWidth] = createSignal(400);
  const [isDragging, setIsDragging] = createSignal(false);
  
  // Memoize the processed data to avoid recalculating unless row changes
  const processedData = createMemo(() => {
    if (!props.row) return null;
    return processRowData(props.row);
  });

  // Memoize the highlighted JSON to avoid recalculating unless processed data or theme changes
  const highlightedJson = createMemo(() => {
    const data = processedData();
    if (!data) return "";
    
    const jsonString = JSON.stringify(data, null, 2);
    return syntaxHighlightJson(jsonString, props.theme);
  });
  
  // Start resizing
  function startResize(e: MouseEvent) {
    e.preventDefault();
    setIsDragging(true);
    
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging()) {
        // Calculate width from right edge of screen
        const newWidth = window.innerWidth - e.clientX;
        // Limit minimum width
        if (newWidth > 200) {
          setSidebarWidth(newWidth);
          // Save width to localStorage
          localStorage.setItem('sidebarWidth', newWidth.toString());
        }
      }
    };
    
    const onMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }
  
  // Load saved width on mount
  onMount(() => {
    const savedWidth = localStorage.getItem('sidebarWidth');
    if (savedWidth) {
      setSidebarWidth(parseInt(savedWidth));
    }
  });
  
  // Process row data for display
  function processRowData(row: Record<string, unknown>): Record<string, unknown> {
    const processed: Record<string, unknown> = {};
    
    // Process each field to parse JSON values
    for (const [key, value] of Object.entries(row)) {
      processed[key] = parseJsonValue(value);
    }
    
    return processed;
  }

  return (
    <Show when={props.isOpen}>
      <div 
        class={`fixed inset-y-0 right-0 ${themeColors[props.theme].sidebar} border-l ${themeColors[props.theme].sidebarBorder} shadow-lg z-10 flex flex-col`}
        style={{ width: `${sidebarWidth()}px` }}
      >
        {/* Resize handle */}
        <div 
          class="absolute top-0 bottom-0 left-0 w-1 cursor-ew-resize hover:bg-blue-800 hover:opacity-50"
          onMouseDown={startResize}
        ></div>
        
        <div class={`flex items-center justify-between p-4 border-b ${themeColors[props.theme].sidebarBorder}`}>
          <h3 class="font-medium">
            Row Details {props.selectedRowIndex !== null ? `(Row ${props.selectedRowIndex + 1})` : ''}
          </h3>
          <button
            type="button"
            onClick={props.onClose}
            class={`p-1 rounded-full ${themeColors[props.theme].hover}`}
          >
            <span class="material-icons">close</span>
          </button>
        </div>
        
        <div class="flex-1 overflow-auto p-4">
          <Show when={processedData()} fallback={
            <div class={`flex flex-col items-center justify-center h-full ${themeColors[props.theme].subText}`}>
              <span class="material-icons text-4xl mb-4">info</span>
              <p>Select a row to view details</p>
            </div>
          }>
            <pre 
              class={`text-sm whitespace-pre-wrap ${themeColors[props.theme].background} border ${themeColors[props.theme].border} p-4 rounded ${props.theme === 'tokyo' ? 'tokyo-text-override' : ''}`}
              style={{
                "font-family": props.fontFamily,
                "font-size": `${props.fontSize}px`
              }}
              innerHTML={highlightedJson()}
            ></pre>
          </Show>
        </div>
      </div>
    </Show>
  );
};

export default RowDetailSidebar; 