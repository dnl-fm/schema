import { Show, createSignal } from "solid-js";
import { ConnectionHistory } from "../types.ts";
import RecentConnections from "./RecentConnections.tsx";
import { open } from '@tauri-apps/plugin-dialog';
import { themeColors } from "../utils/theme.ts";
import { ThemeMode } from "../types/theme.ts";

interface ConnectionDialogProps {
  dbPath: string;
  onDbPathChange: (path: string) => void;
  libsqlUrl: string;
  onLibsqlUrlChange: (url: string) => void;
  authToken: string;
  onAuthTokenChange: (token: string) => void;
  connectionType: 'sqlite' | 'libsql';
  onConnectionTypeChange: (type: 'sqlite' | 'libsql') => void;
  onConnect: () => void;
  isLoading: boolean;
  isConnected: boolean;
  theme: ThemeMode;
  recentConnections: ConnectionHistory[];
  onSelectRecent: (connection: ConnectionHistory) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectionDialog = (props: ConnectionDialogProps) => {
  const [formErrors, setFormErrors] = createSignal<{
    dbPath?: string;
    libsqlUrl?: string;
    authToken?: string;
  }>({});

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
        setFormErrors(prev => ({ ...prev, dbPath: undefined }));
      }
    } catch (error) {
      console.error("Failed to open file dialog:", error);
    }
  };

  // Validate form before connecting
  const handleConnect = () => {
    const errors: {
      dbPath?: string;
      libsqlUrl?: string;
      authToken?: string;
    } = {};
    
    if (props.connectionType === 'sqlite') {
      if (!props.dbPath.trim()) {
        errors.dbPath = "Database path is required";
      }
    } else {
      if (!props.libsqlUrl.trim()) {
        errors.libsqlUrl = "LibSQL URL is required";
      } else {
        try {
          new URL(props.libsqlUrl);
        } catch (e) {
          errors.libsqlUrl = "Invalid URL format";
        }
      }
      
      // Auth token is required for remote LibSQL databases
      if (!props.libsqlUrl.includes("localhost") && 
          !props.libsqlUrl.includes("127.0.0.1") && 
          !props.authToken.trim()) {
        errors.authToken = "Auth token is required for remote databases";
      }
    }
    
    setFormErrors(errors);
    
    // Only connect if there are no errors
    if (Object.keys(errors).length === 0) {
      props.onConnect();
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
            {/* Connection Type Selection */}
            <div>
              <label class={`block text-base font-medium ${themeColors[props.theme].headerText} mb-2`}>
                Connection Type
              </label>
              <div class="flex gap-4">
                <label class="flex items-center">
                  <input
                    type="radio"
                    name="connectionType"
                    value="sqlite"
                    checked={props.connectionType === 'sqlite'}
                    onChange={(e) => {
                      props.onConnectionTypeChange(e.currentTarget.value as 'sqlite' | 'libsql');
                      setFormErrors({});
                    }}
                    class="mr-2"
                  />
                  SQLite
                </label>
                <label class="flex items-center">
                  <input
                    type="radio"
                    name="connectionType"
                    value="libsql"
                    checked={props.connectionType === 'libsql'}
                    onChange={(e) => {
                      props.onConnectionTypeChange(e.currentTarget.value as 'sqlite' | 'libsql');
                      setFormErrors({});
                    }}
                    class="mr-2"
                  />
                  LibSQL
                </label>
              </div>
            </div>

            <Show when={props.connectionType === 'sqlite'}>
              <div>
                <label class={`block text-base font-medium ${themeColors[props.theme].headerText} mb-2`}>
                  Database Path
                </label>
                <div class="flex gap-2">
                  <input
                    type="text"
                    value={props.dbPath}
                    onChange={(e) => {
                      props.onDbPathChange(e.currentTarget.value);
                      if (e.currentTarget.value.trim()) {
                        setFormErrors(prev => ({ ...prev, dbPath: undefined }));
                      }
                    }}
                    placeholder="Enter SQLite database path..."
                    class={`flex-1 px-3 py-2 rounded ${themeColors[props.theme].inputBg} ${themeColors[props.theme].text} border ${formErrors().dbPath ? 'border-red-500' : themeColors[props.theme].border} placeholder-gray-500`}
                  />
                  <button
                    onClick={handleFileSelect}
                    class={`px-3 py-2 ${themeColors[props.theme].buttonBg} ${themeColors[props.theme].buttonHover} border ${themeColors[props.theme].border} rounded flex items-center`}
                    title="Browse for database file"
                  >
                    <span class="material-icons">folder_open</span>
                  </button>
                </div>
                <Show when={formErrors().dbPath}>
                  <p class="text-red-500 text-sm mt-1">{formErrors().dbPath}</p>
                </Show>
              </div>
            </Show>

            <Show when={props.connectionType === 'libsql'}>
              <div>
                <label class={`block text-base font-medium ${themeColors[props.theme].headerText} mb-2`}>
                  LibSQL URL
                </label>
                <input
                  type="text"
                  value={props.libsqlUrl}
                  onChange={(e) => {
                    props.onLibsqlUrlChange(e.currentTarget.value);
                    if (e.currentTarget.value.trim()) {
                      try {
                        new URL(e.currentTarget.value);
                        setFormErrors(prev => ({ ...prev, libsqlUrl: undefined }));
                      } catch (e) {
                        // Don't set error yet - wait for connect button click
                      }
                    }
                  }}
                  placeholder="Enter LibSQL URL (e.g., https://your-database.turso.io)"
                  class={`w-full px-3 py-2 rounded ${themeColors[props.theme].inputBg} ${themeColors[props.theme].text} border ${formErrors().libsqlUrl ? 'border-red-500' : themeColors[props.theme].border} placeholder-gray-500`}
                />
                <Show when={formErrors().libsqlUrl}>
                  <p class="text-red-500 text-sm mt-1">{formErrors().libsqlUrl}</p>
                </Show>
                <p class="text-sm text-gray-500 mt-1">
                  For Turso databases, use https://your-database.turso.io
                </p>
              </div>

              <div>
                <label class={`block text-base font-medium ${themeColors[props.theme].headerText} mb-2`}>
                  Auth Token
                </label>
                <input
                  type="password"
                  value={props.authToken}
                  onChange={(e) => {
                    props.onAuthTokenChange(e.currentTarget.value);
                    if (e.currentTarget.value.trim()) {
                      setFormErrors(prev => ({ ...prev, authToken: undefined }));
                    }
                  }}
                  placeholder="Enter your authentication token"
                  class={`w-full px-3 py-2 rounded ${themeColors[props.theme].inputBg} ${themeColors[props.theme].text} border ${formErrors().authToken ? 'border-red-500' : themeColors[props.theme].border} placeholder-gray-500`}
                />
                <Show when={formErrors().authToken}>
                  <p class="text-red-500 text-sm mt-1">{formErrors().authToken}</p>
                </Show>
                <p class="text-sm text-gray-500 mt-1">
                  Find your auth token in the Turso dashboard or generate one with the Turso CLI
                </p>
              </div>
            </Show>

            <div class="flex justify-end pt-4">
              <button
                onClick={handleConnect}
                disabled={props.isLoading}
                class={getConnectButtonClasses()}
              >
                {props.isLoading ? "Connecting..." : "Connect"}
              </button>
            </div>

            <Show when={props.recentConnections.length > 0}>
              <div class="mt-8 pt-6 border-t border-gray-200">
                <h3 class="text-lg font-medium mb-4">Recent Connections</h3>
                <RecentConnections
                  connections={props.recentConnections}
                  onSelect={props.onSelectRecent}
                  theme={props.theme}
                />
              </div>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default ConnectionDialog; 