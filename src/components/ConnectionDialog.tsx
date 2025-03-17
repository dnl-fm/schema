import { Show } from "solid-js";
import { ConnectionHistory } from "../types.ts";
import RecentConnections from "./RecentConnections.tsx";
import { open } from '@tauri-apps/plugin-dialog';
import { themeColors } from "../utils/theme.ts";
import { ThemeMode } from "../types/theme.ts";

interface ConnectionDialogProps {
  dbPath: string;
  onDbPathChange: (path: string) => void;
  onConnect: () => void;
  isLoading: boolean;
  isConnected: boolean;
  theme: ThemeMode;
  recentConnections: ConnectionHistory[];
  onSelectRecent: (path: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectionDialog = (props: ConnectionDialogProps) => {
  const handleFileSelect = async () => {
    try {
      const selected = await open({
        multiple: false,
        directory: false,
        filters: [{
          name: 'SQLite Database',
          extensions: ['db', 'sqlite', 'sqlite3']
        }]
      });
      
      if (selected) {
        props.onDbPathChange(selected);
      }
    } catch (error) {
      console.error("Failed to open file dialog:", error);
    }
  };

  // Get button color based on theme
  const getConnectButtonClasses = () => {
    // Common button styles for all themes
    return `w-full px-4 py-2 text-white rounded disabled:opacity-50 ${themeColors[props.theme].primaryButtonBg} ${themeColors[props.theme].primaryButtonHover}`;
  };

  return (
    <Show when={props.isOpen}>
      <div class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
        <div class={`${themeColors[props.theme].background} ${themeColors[props.theme].text} border ${themeColors[props.theme].border} rounded-lg shadow-xl p-8 w-[640px] max-h-[90vh] overflow-y-auto`}>
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold">Connect to Database</h2>
            <button 
              type="button"
              onClick={props.onClose}
              class={`p-2 rounded-full ${themeColors[props.theme].hover}`}
            >
              <span class="material-icons">close</span>
            </button>
          </div>
          
          <div class="space-y-6">
            <div>
              <label class={`block text-base font-medium ${themeColors[props.theme].headerText} mb-2`}>
                Database Path
              </label>
              <div class="flex gap-2">
                <input
                  type="text"
                  value={props.dbPath}
                  onChange={(e) => props.onDbPathChange(e.currentTarget.value)}
                  placeholder="Enter SQLite database path..."
                  class={`flex-1 px-3 py-2 rounded ${themeColors[props.theme].inputBg} ${themeColors[props.theme].text} border ${themeColors[props.theme].border} placeholder-gray-500`}
                />
                <button
                  onClick={handleFileSelect}
                  class={`px-3 py-2 ${themeColors[props.theme].buttonBg} ${themeColors[props.theme].buttonHover} border ${themeColors[props.theme].border} rounded flex items-center`}
                  title="Browse for database file"
                >
                  <span class="material-icons">folder_open</span>
                </button>
              </div>
            </div>
            
            <button 
              onClick={props.onConnect} 
              disabled={props.isLoading}
              class={getConnectButtonClasses()}
            >
              {props.isLoading ? "Connecting..." : props.isConnected ? "Reconnect" : "Connect"}
            </button>
            
            <RecentConnections 
              connections={props.recentConnections} 
              onSelect={props.onSelectRecent} 
              theme={props.theme}
            />
          </div>
        </div>
      </div>
    </Show>
  );
};

export default ConnectionDialog; 