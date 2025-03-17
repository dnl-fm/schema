import { For } from "solid-js";
import { ConnectionHistory } from "../types.ts";
import { themeColors } from "../utils/theme.ts";
import { ThemeMode } from "../types/theme.ts";

interface RecentConnectionsProps {
  connections: ConnectionHistory[];
  onSelect: (connection: ConnectionHistory) => void;
  theme: ThemeMode;
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
    <div class={`border ${themeColors[props.theme].border} rounded-md overflow-hidden w-full`}>
      <ul class={`divide-y ${themeColors[props.theme].divider}`}>
        <For each={props.connections}>
          {(connection) => (
            <li>
              <button
                type="button"
                onClick={() => props.onSelect(connection)}
                class={`w-full text-left px-4 py-3 ${themeColors[props.theme].hover} flex items-center`}
              >
                <div class="flex-1">
                  <div class={`font-medium ${themeColors[props.theme].headerText}`}>
                    {getDisplayName(connection)}
                  </div>
                  <div class={`text-sm ${themeColors[props.theme].subText} break-all`}>
                    {getFullPath(connection)}
                  </div>
                  <div class={`text-xs ${themeColors[props.theme].subText} mt-1`}>
                    {connection.type === 'sqlite' ? 'SQLite' : 'LibSQL'}
                  </div>
                </div>
              </button>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
};

export default RecentConnections; 