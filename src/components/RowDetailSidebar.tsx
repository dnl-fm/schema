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
  const [showResizeHint, setShowResizeHint] = createSignal(false);
  const [contentRef, setContentRef] = createSignal<HTMLPreElement | null>(null);
  
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
  
  // Show resize hint tooltip briefly after component mounts
  onMount(() => {
    const savedWidth = localStorage.getItem('sidebarWidth');
    if (savedWidth) {
      setSidebarWidth(parseInt(savedWidth));
    }
    
    // Show resize hint briefly
    setShowResizeHint(true);
    setTimeout(() => setShowResizeHint(false), 2000);
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

  // Handle double-click to auto-resize sidebar to fit content
  function handleDoubleClick() {
    const content = contentRef();
    if (!content) return;
    
    // Calculate the maximum line length in the pre element
    // Include a small additional buffer for strings with quotes and dates
    const lines = content.innerText.split('\n');
    let maxLineWidth = 0;
    
    // Create a temporary element to measure text width that matches our display style
    const tempEl = document.createElement('pre');
    tempEl.style.fontFamily = props.fontFamily;
    tempEl.style.fontSize = `${props.fontSize}px`;
    tempEl.style.position = 'absolute';
    tempEl.style.visibility = 'hidden';
    tempEl.style.whiteSpace = 'pre'; // Use 'pre' instead of 'nowrap' to match rendering
    tempEl.style.padding = '0';
    tempEl.style.margin = '0';
    // Match any other styles that might affect text rendering
    tempEl.className = props.theme === 'tokyo' ? 'tokyo-text-override' : '';
    document.body.appendChild(tempEl);
    
    // Use a more accurate approach to measure the content
    let longestLine = '';
    lines.forEach(line => {
      // Add extra width for lines containing date-like strings (they're often problematic)
      if (line.match(/\d{4}-\d{2}-\d{2}/) || line.includes("T")) {
        line = line + "      "; // Add extra padding for date strings
      }
      if (line.length > longestLine.length) {
        longestLine = line;
      }
    });
    
    // Measure the longest line
    tempEl.textContent = longestLine;
    maxLineWidth = tempEl.getBoundingClientRect().width;
    
    // Remove temporary element
    document.body.removeChild(tempEl);
    
    // Add padding and set width with extra buffer for dates and special characters
    const newWidth = maxLineWidth + 10; // Increased padding for better handling of dates
    const maxAllowedWidth = window.innerWidth * 0.95;
    const finalWidth = Math.min(Math.max(newWidth, 300), maxAllowedWidth);
    
    setSidebarWidth(finalWidth);
    localStorage.setItem('sidebarWidth', finalWidth.toString());
  }

  return (
    <Show when={props.isOpen}>
      <div 
        class={`fixed inset-y-0 right-0 ${themeColors[props.theme].sidebar} border-l ${themeColors[props.theme].sidebarBorder} shadow-lg z-10 flex flex-col`}
        style={{ width: `${sidebarWidth()}px` }}
      >
        {/* Resize handle */}
        <div 
          class="absolute top-0 bottom-0 left-0 w-4 cursor-ew-resize flex items-center justify-center group z-10"
          onMouseDown={startResize}
          onDblClick={handleDoubleClick}
          title="Drag to resize sidebar. Double-click to auto-fit content."
          onMouseEnter={() => setShowResizeHint(true)}
          onMouseLeave={() => setShowResizeHint(false)}
        >
          <div class={`h-16 w-1 ${themeColors[props.theme].buttonBg} group-hover:bg-blue-500 transition-colors`}></div>
        </div>
        
        {/* Resize hint tooltip */}
        <Show when={showResizeHint()}>
          <div 
            class={`absolute top-1/2 left-6 transform -translate-y-1/2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded pointer-events-none z-20 animate-pulse`}
            style={{ "max-width": "160px" }}
          >
            Drag to resize or double-click to auto-fit
          </div>
        </Show>
        
        <div class={`flex items-center justify-between p-4 border-b ${themeColors[props.theme].sidebarBorder}`}>
          <h3 class="font-medium flex items-center">
            Row Details {props.selectedRowIndex !== null ? `(Row ${props.selectedRowIndex + 1})` : ''}
            <span class={`ml-2 text-xs ${themeColors[props.theme].subText} flex items-center`} title="Drag left edge to resize or double-click to auto-fit">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
              </svg>
              <span class="text-xs">double-click to fit</span>
            </span>
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
              ref={setContentRef}
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