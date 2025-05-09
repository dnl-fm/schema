import { Show, createSignal, onMount, createEffect } from "solid-js";
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
  onConnect: (options?: { saveOnly?: boolean }) => void;
  isLoading: boolean;
  isConnected: boolean;
  theme: ThemeMode;
  recentConnections: ConnectionHistory[];
  onSelectRecent: (connection: ConnectionHistory) => void;
  onRemoveConnection: (connection: ConnectionHistory) => void;
  onEditConnection: (connection: ConnectionHistory) => void;
  isOpen: boolean;
  onClose: () => void;
  savedConnections: ConnectionHistory[];
  isEditing: boolean;
}

export const ConnectionDialog = (props: ConnectionDialogProps) => {
  const [formErrors, setFormErrors] = createSignal<{
    dbPath?: string;
    libsqlUrl?: string;
    authToken?: string;
  }>({});
  const [testingConnection, setTestingConnection] = createSignal(false);
  const [testResult, setTestResult] = createSignal<{success: boolean; message: string} | null>(null);
  const [showConnectionForm, setShowConnectionForm] = createSignal(false);
  const [saveSuccess, setSaveSuccess] = createSignal(false);
  const [connectionColor, setConnectionColor] = createSignal<string>("#000000");

  // Expose a function to show/hide the connection form from outside
  onMount(() => {
    if (typeof window !== "undefined") {
      (window as any).showConnectionForm = setShowConnectionForm;
    }
  });

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

  // Test LibSQL connection
  const handleTestConnection = async () => {
    if (!validateLibSQLForm()) return;
    
    setTestingConnection(true);
    setTestResult(null);
    
    try {
      // Create a temporary client to test the connection
      const { createDatabaseClient } = await import("../lib/database.ts");
      const testClient = createDatabaseClient({
        type: 'libsql',
        url: props.libsqlUrl,
        authToken: props.authToken
      });
      
      // Try to connect
      await testClient.connect();
      
      // If we get here, connection was successful
      setTestResult({
        success: true,
        message: "Connection successful!"
      });
      
      // Clean up
      await testClient.disconnect?.();
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : String(err)
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // Validate form before connecting
  const handleConnect = (saveOnly?: boolean) => {
    let formErrors = validateForm();
    
    // If there are form errors, display them and abort
    if (Object.keys(formErrors).length > 0) {
      setFormErrors(formErrors);
      return;
    }
    
    // Prepare options object with the color
    const options = {
      saveOnly,
      color: connectionColor()
    };
    
    // Call the parent onConnect function with the options
    props.onConnect(options);
    
    // Hide the connection form and clear errors
    setFormErrors({});
    setSaveSuccess(false);
    setTestResult(null);
  };
  
  // Validate SQLite form
  const validateSQLiteForm = () => {
    const errors: {dbPath?: string} = {};
    
    if (!props.dbPath.trim()) {
      errors.dbPath = "Database path is required";
      setFormErrors(prev => ({ ...prev, ...errors }));
      return false;
    }
    
    setFormErrors(prev => ({ ...prev, dbPath: undefined }));
    return true;
  };
  
  // Validate LibSQL form
  const validateLibSQLForm = () => {
    const errors: {libsqlUrl?: string; authToken?: string} = {};
    
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
    
    setFormErrors(prev => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };
  
  // Validate form for both connection types
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (props.connectionType === 'sqlite') {
      // Check if SQLite path is provided
      if (!props.dbPath.trim()) {
        errors.dbPath = 'Database path is required';
      }
    } else {
      // Check if LibSQL URL is provided
      if (!props.libsqlUrl.trim()) {
        errors.libsqlUrl = 'Database URL is required';
      } else {
        // Validate URL format
        try {
          new URL(props.libsqlUrl);
        } catch (e) {
          errors.libsqlUrl = 'Invalid URL format';
        }
      }
    }
    
    return errors;
  };

  // Get button color based on theme
  const getButtonClasses = (isPrimary = true) => {
    if (isPrimary) {
      return `px-4 py-2 text-white rounded disabled:opacity-50 ${themeColors[props.theme].primaryButtonBg} ${themeColors[props.theme].primaryButtonHover}`;
    }
    return `px-4 py-2 rounded disabled:opacity-50 ${themeColors[props.theme].buttonBg} hover:bg-opacity-80 transition-colors ${themeColors[props.theme].buttonHover} border ${themeColors[props.theme].border}`;
  };

  // Toggle connection form visibility
  const toggleConnectionForm = () => {
    setShowConnectionForm(!showConnectionForm());
    // Reset form when showing it
    if (!showConnectionForm()) {
      setFormErrors({});
      setTestResult(null);
    }
  };

  // When showing the connection form, set a default color based on connection type
  createEffect(() => {
    if (showConnectionForm()) {
      // Set a default color based on connection type
      if (props.connectionType === 'sqlite') {
        setConnectionColor('#0d9488'); // Teal for SQLite
      } else {
        setConnectionColor('#3b82f6'); // Blue for LibSQL
      }
    }
  });

  return (
    <Show when={props.isOpen}>
      <div class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
        <div class={`${themeColors[props.theme].background} ${themeColors[props.theme].text} rounded-lg shadow-xl p-8 w-[640px] max-h-[90vh] overflow-y-auto`}>
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold">Connect to Database</h2>
            <button 
              type="button"
              onClick={props.onClose}
              class={`p-2 rounded-full hover:bg-gray-700 hover:bg-opacity-70 transition-colors`}
              aria-label="Close"
            >
              <span class="material-icons">close</span>
            </button>
          </div>
          
          <div class="space-y-6">
            {/* Add Connection Button */}
            <Show when={!showConnectionForm()}>
              <div class="flex justify-between items-center">
                <button
                  type="button"
                  onClick={toggleConnectionForm}
                  class={`flex items-center ${getButtonClasses(true)}`}
                >
                  <span class="material-icons mr-1">add</span>
                  New Connection
                </button>
                
                {/* Success Message */}
                <Show when={saveSuccess()}>
                  <div class="text-green-600 dark:text-green-400 flex items-center">
                    <span class="material-icons mr-1">check_circle</span>
                    Connection saved successfully
                  </div>
                </Show>
              </div>
            </Show>
            
            {/* Connection Form */}
            <Show when={showConnectionForm()}>
              <div class="rounded-md p-4 space-y-6 bg-opacity-50 bg-gray-800">
                <div class="flex justify-between items-center">
                  <h3 class="text-lg font-medium">{props.isEditing ? "Edit Connection" : "New Connection"}</h3>
                  <button
                    type="button"
                    onClick={toggleConnectionForm}
                    class={`p-1.5 rounded-full hover:bg-gray-700 hover:bg-opacity-70 transition-colors`}
                    title="Close form"
                  >
                    <span class="material-icons">close</span>
                  </button>
                </div>
                
                {/* Connection Type Selection */}
                <div>
                  <label class={`block text-base font-medium ${themeColors[props.theme].headerText} mb-2`}>
                    Connection Type
                  </label>
                  <div class="flex gap-4">
                    <label class={`flex items-center ${props.isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}>
                      <input
                        type="radio"
                        name="connectionType"
                        value="sqlite"
                        checked={props.connectionType === 'sqlite'}
                        onChange={(e) => {
                          if (!props.isEditing) {
                            props.onConnectionTypeChange(e.currentTarget.value as 'sqlite' | 'libsql');
                            setFormErrors({});
                            setTestResult(null);
                          }
                        }}
                        disabled={props.isEditing}
                        class="mr-2"
                      />
                      SQLite
                    </label>
                    <label class={`flex items-center ${props.isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}>
                      <input
                        type="radio"
                        name="connectionType"
                        value="libsql"
                        checked={props.connectionType === 'libsql'}
                        onChange={(e) => {
                          if (!props.isEditing) {
                            props.onConnectionTypeChange(e.currentTarget.value as 'sqlite' | 'libsql');
                            setFormErrors({});
                            setTestResult(null);
                          }
                        }}
                        disabled={props.isEditing}
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
                        class={`px-3 py-2 ${themeColors[props.theme].buttonBg} hover:bg-opacity-80 transition-colors rounded flex items-center`}
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
                        setTestResult(null);
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
                        setTestResult(null);
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
                  
                  {/* Test Connection Button and Result */}
                  <div>
                    <button
                      onClick={handleTestConnection}
                      disabled={testingConnection()}
                      class={`mt-2 ${getButtonClasses(false)}`}
                    >
                      {testingConnection() ? (
                        <span class="flex items-center">
                          <span class="material-icons animate-spin mr-2 text-sm">refresh</span>
                          Testing...
                        </span>
                      ) : (
                        "Test Connection"
                      )}
                    </button>
                    
                    <Show when={testResult()}>
                      <div 
                        class={`mt-3 p-3 rounded ${
                          testResult()?.success 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        <div class="flex items-start">
                          <span 
                            class="material-icons mr-2"
                          >
                            {testResult()?.success ? 'check_circle' : 'error'}
                          </span>
                          <span>{testResult()?.message}</span>
                        </div>
                      </div>
                    </Show>
                  </div>
                </Show>

                {/* Color Picker */}
                <div>
                  <label class={`block text-base font-medium ${themeColors[props.theme].headerText} mb-2`}>
                    Connection Color
                  </label>
                  <div class="flex items-center gap-4">
                    <input
                      type="color"
                      value={connectionColor()}
                      onChange={(e) => setConnectionColor(e.currentTarget.value)}
                      class="w-12 h-12 rounded cursor-pointer"
                    />
                    <div class="flex gap-2">
                      <button 
                        type="button" 
                        onClick={() => setConnectionColor('#0d9488')} 
                        class="w-8 h-8 rounded-full bg-teal-600 border-2 border-white"
                        title="SQLite (Teal)"
                      />
                      <button 
                        type="button" 
                        onClick={() => setConnectionColor('#3b82f6')} 
                        class="w-8 h-8 rounded-full bg-blue-500 border-2 border-white"
                        title="LibSQL (Blue)"
                      />
                      <button 
                        type="button" 
                        onClick={() => setConnectionColor('#8b5cf6')} 
                        class="w-8 h-8 rounded-full bg-purple-500 border-2 border-white"
                        title="Purple"
                      />
                      <button 
                        type="button" 
                        onClick={() => setConnectionColor('#ef4444')} 
                        class="w-8 h-8 rounded-full bg-red-500 border-2 border-white"
                        title="Red"
                      />
                      <button 
                        type="button" 
                        onClick={() => setConnectionColor('#f59e0b')} 
                        class="w-8 h-8 rounded-full bg-amber-500 border-2 border-white"
                        title="Amber"
                      />
                    </div>
                  </div>
                  <div class={`text-sm ${themeColors[props.theme].subText} mt-1`}>
                    This color will be used for the connection indicator
                  </div>
                </div>

                {/* Save and Connect buttons */}
                <div class="flex justify-end pt-4 gap-3">
                  <button
                    onClick={() => handleConnect(true)}
                    disabled={props.isLoading}
                    class={`${getButtonClasses(false)} hover:bg-gray-600 dark:hover:bg-gray-700`}
                    title="Save without connecting"
                  >
                    {props.isLoading ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => handleConnect()}
                    disabled={props.isLoading}
                    class={`${getButtonClasses(true)} hover:bg-gray-600 dark:hover:bg-gray-700`}
                    title="Connect to database"
                  >
                    {props.isLoading ? (
                      <span class="animate-spin material-icons text-sm">refresh</span>
                    ) : (
                      <span class="material-icons text-sm">lan</span>
                    )}
                    {props.isLoading ? "Connecting..." : "Connect"}
                  </button>
                </div>
              </div>
            </Show>

            {/* Saved Connections and Recent Connections sections */}
            <Show when={!showConnectionForm()}>
              <div class="mt-8 space-y-6">
                {/* Saved Connections */}
                <Show when={props.savedConnections.length > 0}>
                  <div class="pt-6 border-t border-gray-600">
                    <h3 class="text-lg font-medium mb-4">Saved Connections</h3>
                    <RecentConnections
                      connections={props.savedConnections}
                      onSelect={props.onSelectRecent}
                      onRemove={props.onRemoveConnection}
                      onEdit={props.onEditConnection}
                      theme={props.theme}
                      showKeyboardShortcuts={false}
                    />
                  </div>
                </Show>
                
                {/* Recent Connections */}
                <Show when={props.recentConnections.length > 0}>
                  <div class="pt-6 border-t border-gray-600">
                    <h3 class="text-lg font-medium mb-4">Recent Connections</h3>
                    <RecentConnections
                      connections={props.recentConnections}
                      onSelect={props.onSelectRecent}
                      onRemove={props.onRemoveConnection}
                      onEdit={props.onEditConnection}
                      theme={props.theme}
                      showKeyboardShortcuts={true}
                    />
                  </div>
                </Show>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default ConnectionDialog; 