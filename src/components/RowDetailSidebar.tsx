import { createSignal, onMount, Show } from "solid-js";
import { parseJsonValue, syntaxHighlightJson } from "../utils.ts";

interface RowDetailSidebarProps {
  row: Record<string, unknown> | null;
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  fontFamily: string;
  fontSize: string;
  selectedRowIndex: number | null;
}

export const RowDetailSidebar = (props: RowDetailSidebarProps) => {
  const [sidebarWidth, setSidebarWidth] = createSignal(400);
  const [isDragging, setIsDragging] = createSignal(false);
  
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
        class={`fixed inset-y-0 right-0 ${props.theme === 'dark' ? 'bg-black border-gray-800' : 'bg-white border-gray-200'} shadow-lg border-l z-10 flex flex-col`}
        style={{ width: `${sidebarWidth()}px` }}
      >
        {/* Resize handle */}
        <div 
          class="absolute top-0 bottom-0 left-0 w-1 cursor-ew-resize hover:bg-blue-800 hover:opacity-50"
          onMouseDown={startResize}
        ></div>
        
        <div class={`flex items-center justify-between p-4 border-b ${props.theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
          <h3 class="font-medium">
            Row Details {props.selectedRowIndex !== null ? `(Row ${props.selectedRowIndex + 1})` : ''}
          </h3>
          <button 
            onClick={props.onClose}
            class={`p-1 rounded-full ${props.theme === 'dark' ? 'hover:bg-gray-900' : 'hover:bg-gray-100'}`}
          >
            <span class="material-icons">close</span>
          </button>
        </div>
        
        <div class="flex-1 overflow-auto p-4">
          <Show when={props.row} fallback={
            <div class={`flex flex-col items-center justify-center h-full ${props.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              <span class="material-icons text-4xl mb-4">info</span>
              <p>Select a row to view details</p>
            </div>
          }>
            {(row) => (
              <pre 
                class={`text-sm whitespace-pre-wrap ${props.theme === 'dark' ? 'bg-black border-gray-800' : 'bg-gray-50 border-gray-200'} p-4 rounded border`}
                style={{
                  "font-family": props.fontFamily,
                  "font-size": `${props.fontSize}px`
                }}
                innerHTML={syntaxHighlightJson(JSON.stringify(processRowData(row()), null, 2), props.theme)}
              ></pre>
            )}
          </Show>
        </div>
      </div>
    </Show>
  );
};

export default RowDetailSidebar; 