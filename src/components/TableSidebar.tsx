interface TableSidebarProps {
  tables: string[];
  selectedTable: string;
  onSelectTable: (table: string) => void;
  theme: 'light' | 'dark';
  onToggleSettings: () => void;
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
    <div class={`w-16 h-full flex flex-col ${props.theme === 'dark' ? 'bg-black border-gray-800' : 'bg-gray-100 border-gray-200'} border-r`}>
      {/* Database icon at top */}
      <div class={`p-2 flex justify-center border-b ${props.theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
        <button
          type="button"
          onClick={props.onConnect}
          class={`p-2 rounded-full ${props.theme === 'dark' ? 'hover:bg-gray-900' : 'hover:bg-gray-200'}`}
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
          class={`p-2 rounded-full ${props.theme === 'dark' ? 'hover:bg-gray-900' : 'hover:bg-gray-200'} ${props.tablesVisible ? (props.theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200') : ''}`}
          title="Tables"
        >
          <span class="material-icons text-2xl">table_chart</span>
        </button>
      </div>
      
      {/* Bottom buttons */}
      <div class={`p-2 flex flex-col items-center gap-2 border-t ${props.theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
        <button
          type="button"
          onClick={props.onReload}
          disabled={!props.isConnected || props.isLoading}
          class={`p-2 rounded-full ${props.theme === 'dark' ? 'hover:bg-gray-900' : 'hover:bg-gray-200'} ${!props.isConnected || props.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Reload Connection"
        >
          <span class="material-icons text-2xl">refresh</span>
        </button>
        <button
          type="button"
          onClick={props.onToggleSettings}
          class={`p-2 rounded-full ${props.theme === 'dark' ? 'hover:bg-gray-900' : 'hover:bg-gray-200'}`}
          title="Settings"
        >
          <span class="material-icons text-2xl">settings</span>
        </button>
      </div>
    </div>
  );
};

export default TableSidebar; 