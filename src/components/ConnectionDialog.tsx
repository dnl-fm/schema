import { Show } from "solid-js";
import { ConnectionHistory } from "../types";
import RecentConnections from "./RecentConnections";

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
  return (
    <Show when={props.isOpen}>
      <div class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
        <div class={`${props.theme === 'dark' ? 'bg-black text-white border border-gray-800' : 'bg-white'} rounded-lg shadow-xl p-6 w-96`}>
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">Connect to Database</h2>
            <button 
              onClick={props.onClose}
              class={`p-1 rounded-full ${props.theme === 'dark' ? 'hover:bg-gray-900' : 'hover:bg-gray-100'}`}
            >
              <span class="material-icons">close</span>
            </button>
          </div>
          
          <div class="space-y-4">
            <div>
              <label class={`block text-sm font-medium ${props.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Database Path
              </label>
              <input
                type="text"
                value={props.dbPath}
                onChange={(e) => props.onDbPathChange(e.currentTarget.value)}
                placeholder="Enter SQLite database path..."
                class={`w-full px-3 py-2 rounded ${props.theme === 'dark' ? 'bg-black text-white border border-gray-800 placeholder-gray-500' : 'bg-white text-black border border-gray-300'}`}
              />
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