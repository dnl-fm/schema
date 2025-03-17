import { themeColors } from "../utils/theme.ts";
import { ThemeMode } from "../types/theme.ts";

interface TableSidebarProps {
  tables: string[];
  selectedTable: string;
  onSelectTable: (table: string) => void;
  theme: ThemeMode;
  onToggleSettings: () => void;
  onToggleHelp: () => void;
  dbPath: string;
  onDbPathChange: (path: string) => void;
  onConnect: () => void;
  isLoading: boolean;
  isConnected: boolean;
  onToggleTables: () => void;
  tablesVisible: boolean;
  onReload: () => void;
}

export const TableSidebar = (props: TableSidebarProps) => {
  return (
    <div class={`w-16 h-full flex flex-col ${themeColors[props.theme as ThemeMode].sidebar} border-r ${themeColors[props.theme as ThemeMode].sidebarBorder}`}>
      {/* Database icon at top */}
      <div class={`p-2 flex justify-center border-b ${themeColors[props.theme as ThemeMode].sidebarBorder}`}>
        <button
          type="button"
          onClick={props.onConnect}
          class={`p-2 rounded-full ${themeColors[props.theme as ThemeMode].hover}`}
          title="Connect to Database"
        >
          <span class="material-icons text-2xl">storage</span>
        </button>
      </div>
      
      {/* Main nav items */}
      <div class="flex-1 flex flex-col items-center py-4 space-y-4">
        {/* Tables toggle button */}
        <button
          type="button"
          onClick={props.onToggleTables}
          class={`p-2 rounded-full ${themeColors[props.theme as ThemeMode].hover} ${props.tablesVisible ? themeColors[props.theme as ThemeMode].buttonBg : ''}`}
          title="Tables"
        >
          <span class="material-icons text-2xl">table_chart</span>
        </button>
      </div>
      
      {/* Bottom buttons */}
      <div class={`p-2 flex flex-col items-center gap-2 border-t ${themeColors[props.theme as ThemeMode].sidebarBorder}`}>
        <button
          type="button"
          onClick={props.onReload}
          disabled={!props.isConnected || props.isLoading}
          class={`p-2 rounded-full ${themeColors[props.theme as ThemeMode].hover} ${!props.isConnected || props.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Reload Connection"
        >
          <span class="material-icons text-2xl">refresh</span>
        </button>
        <button
          type="button"
          onClick={props.onToggleHelp}
          class={`p-2 rounded-full ${themeColors[props.theme as ThemeMode].hover}`}
          title="Help (Ctrl+H)"
        >
          <span class="material-icons text-2xl">help_outline</span>
        </button>
        <button
          type="button"
          onClick={props.onToggleSettings}
          class={`p-2 rounded-full ${themeColors[props.theme as ThemeMode].hover}`}
          title="Settings"
        >
          <span class="material-icons text-2xl">settings</span>
        </button>
      </div>
    </div>
  );
};

export default TableSidebar; 