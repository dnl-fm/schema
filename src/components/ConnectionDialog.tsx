import { Show } from "solid-js";
import { ConnectionHistory } from "../types";
import RecentConnections from "./RecentConnections";
import { open } from '@tauri-apps/plugin-dialog';

interface ConnectionDialogProps {
  dbPath: string;
  onDbPathChange: (path: string) => void;
  onConnect: () => void;
  isLoading: boolean;
  isConnected: boolean;
  theme: 'light' | 'dark';
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

  return (
    <Show when={props.isOpen}>
      <div class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
        <div class={`${props.theme === 'dark' ? 'bg-black text-white border border-gray-800' : 'bg-white'} rounded-lg shadow-xl p-8 w-[640px] max-h-[90vh] overflow-y-auto`}>
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold">Connect to Database</h2>
            <button 
              onClick={props.onClose}
              class={`p-2 rounded-full ${props.theme === 'dark' ? 'hover:bg-gray-900' : 'hover:bg-gray-100'}`}
            >
              <span class="material-icons">close</span>
            </button>
          </div>
          
          <div class="space-y-6">
            <div>
              <label class={`block text-base font-medium ${props.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Database Path
              </label>
              <div class="flex gap-2">
                <input
                  type="text"
                  value={props.dbPath}
                  onChange={(e) => props.onDbPathChange(e.currentTarget.value)}
                  placeholder="Enter SQLite database path..."
                  class={`flex-1 px-3 py-2 rounded ${props.theme === 'dark' ? 'bg-black text-white border border-gray-800 placeholder-gray-500' : 'bg-white text-black border border-gray-300'}`}
                />
                <button
                  onClick={handleFileSelect}
                  class={`px-3 py-2 ${props.theme === 'dark' ? 'bg-black hover:bg-gray-900 border border-gray-800' : 'bg-gray-100 hover:bg-gray-200 border border-gray-300'} rounded flex items-center`}
                  title="Browse for database file"
                >
                  <span class="material-icons">folder_open</span>
                </button>
              </div>
            </div>
            
            <button 
              onClick={props.onConnect} 
              disabled={props.isLoading}
              class={`w-full px-4 py-2 ${props.theme === 'dark' ? 'bg-blue-800 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded disabled:opacity-50`}
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