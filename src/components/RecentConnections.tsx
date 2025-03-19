import { For } from "solid-js";
import { ConnectionHistory } from "../types.ts";
import { themeColors } from "../utils/theme.ts";
import { ThemeMode } from "../types/theme.ts";

interface RecentConnectionsProps {
  connections: ConnectionHistory[];
  onSelect: (connection: ConnectionHistory) => void;
  onRemove: (connection: ConnectionHistory) => void;
  onEdit: (connection: ConnectionHistory) => void;
  theme: ThemeMode;
  showKeyboardShortcuts?: boolean;
}

export const RecentConnections = (props: RecentConnectionsProps) => {
  // Parse the meta JSON for display
  const getDisplayName = (connection: ConnectionHistory) => {
    try {
      return connection.name.split('/').pop() || connection.name;
    } catch (err) {
      console.error("Error getting display name:", err);
      return "Unknown";
    }
  };
  
  const getFullPath = (connection: ConnectionHistory) => {
    try {
      return connection.name || "Unknown path";
    } catch (err) {
      console.error("Error getting path:", err);
      return "Unknown path";
    }
  };
  
  return (
    <div class={`rounded-md overflow-hidden w-full bg-opacity-50 bg-gray-800`}>
      <ul class={`divide-y divide-gray-700`}>
        <For each={props.connections}>
          {(connection, index) => (
            <li class="relative group">
              <button
                type="button"
                onClick={() => props.onSelect(connection)}
                class={`w-full text-left px-4 py-3 hover:bg-opacity-30 hover:bg-gray-600 flex items-center gap-3 pr-24`}
              >
                <div class={`flex items-center justify-center h-6 w-6 rounded-full bg-gray-700 text-sm font-medium flex-shrink-0`}>
                  {index() + 1}
                </div>
                <div class="flex-1">
                  <div class={`font-medium text-white`}>
                    {getDisplayName(connection)}
                  </div>
                  <div class={`flex items-center justify-between mt-1`}>
                    <div class={`text-xs text-gray-400`}>
                      {connection.type === 'sqlite' ? 'SQLite' : 'LibSQL'}
                    </div>
                  </div>
                </div>
                {props.showKeyboardShortcuts && index() < 5 && (
                  <div class={`absolute right-4 top-1/2 -translate-y-1/2 flex-shrink-0 text-xs text-gray-300 bg-gray-700 px-2 py-0.5 rounded group-hover:opacity-0 transition-opacity`}>
                    Ctrl+{index() + 1}
                  </div>
                )}
              </button>
              <div class="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onEdit(connection);
                  }}
                  class="p-1.5 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors flex items-center justify-center"
                  title="Edit connection"
                >
                  <span class="material-icons text-sm">edit</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onRemove(connection);
                  }}
                  class="p-1.5 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors flex items-center justify-center"
                  title="Remove connection"
                >
                  <span class="material-icons text-sm text-red-500">close</span>
                </button>
              </div>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
};

export default RecentConnections; 