import { createSignal, Show, onMount, onCleanup, For } from "solid-js";
import { QueryResult, ConnectionHistory, AppSettings } from "./types.ts";
import { ThemeMode } from "./types/theme.ts";
import TableSidebar from "./components/TableSidebar.tsx";
import TablesList from "./components/TablesList.tsx";
import ConnectionDialog from "./components/ConnectionDialog.tsx";
import QueryEditor from "./components/QueryEditor.tsx";
import ResultsTable from "./components/ResultsTable.tsx";
import RowDetailSidebar from "./components/RowDetailSidebar.tsx";
import SettingsMenu from "./components/SettingsMenu.tsx";
import HelpDialog from "./components/HelpDialog.tsx";
import { themeColors } from "./utils/theme.ts";
import { createDatabaseClient, type DatabaseClient } from "./lib/database.ts";

type ActiveElement = 'query-editor' | 'results-table' | 'tables-list' | null;

function App() {
  const [dbPath, setDbPath] = createSignal("");
  const [libsqlUrl, setLibsqlUrl] = createSignal("");
  const [authToken, setAuthToken] = createSignal("");
  const [connectionType, setConnectionType] = createSignal<'sqlite' | 'libsql'>('sqlite');
  const [dbClient, setDbClient] = createSignal<DatabaseClient | null>(null);
  const [appDb, setAppDb] = createSignal<DatabaseClient | null>(null);
  const [tables, setTables] = createSignal<string[]>([]);
  const [selectedTable, setSelectedTable] = createSignal("");
  const [queryResults, setQueryResults] = createSignal<QueryResult | null>(null);
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [connected, setConnected] = createSignal(false);
  const [recentConnections, setRecentConnections] = createSignal<ConnectionHistory[]>([]);
  const [settings, setSettings] = createSignal<AppSettings>({
    fontSize: '14',
    fontFamily: 'monospace',
    theme: 'light'
  });
  const [showSettings, setShowSettings] = createSignal(false);
  const [showConnectionDialog, setShowConnectionDialog] = createSignal(false);
  const [showHelpDialog, setShowHelpDialog] = createSignal(false);
  const [tablesVisible, setTablesVisible] = createSignal(true);
  
  // Row detail sidebar state
  const [selectedRow, setSelectedRow] = createSignal<Record<string, unknown> | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = createSignal<number | null>(null);
  const [detailSidebarOpen, setDetailSidebarOpen] = createSignal(false);
  
  // Track active element for keyboard shortcuts
  const [activeElement, setActiveElement] = createSignal<ActiveElement>(null);

  // Initialize app on mount
  onMount(() => {
    initAppDb();
    
    // Set up global keyboard event listeners
    globalThis.addEventListener('keydown', handleGlobalKeyDown);
    globalThis.addEventListener('focusin', handleFocusChange);
    
    onCleanup(() => {
      globalThis.removeEventListener('keydown', handleGlobalKeyDown);
      globalThis.removeEventListener('focusin', handleFocusChange);
    });

    // Make focusQueryEditor available globally
    if (typeof globalThis !== 'undefined') {
      (globalThis as { focusQueryEditor?: () => void }).focusQueryEditor = focusQueryEditor;
    }
  });
  
  // Handle focus changes to track active element
  function handleFocusChange(e: FocusEvent) {
    const target = e.target as HTMLElement;
    
    if (target.tagName === 'TEXTAREA' && target.closest('.query-editor')) {
      setActiveElement('query-editor');
    } else if (target.closest('.results-table') || target.classList.contains('results-table')) {
      setActiveElement('results-table');
    } else if (target.closest('.tables-list') || target.classList.contains('tables-list')) {
      setActiveElement('tables-list');
    } else {
      setActiveElement(null);
    }
  }
  
  // Handle global keyboard shortcuts
  function handleGlobalKeyDown(e: KeyboardEvent) {
    // Global shortcut: Ctrl+H to show help dialog
    if (e.ctrlKey && e.key === 'h') {
      e.preventDefault();
      setShowHelpDialog(true);
      return;
    }
    
    // Global shortcut: Ctrl+Q to focus query editor
    if (e.ctrlKey && e.key === 'q') {
      e.preventDefault();
      focusQueryEditor();
      return;
    }
    
    // Global shortcut: Ctrl+R to focus results table
    if (e.ctrlKey && e.key === 'r') {
      e.preventDefault();
      focusResultsTable();
      return;
    }
    
    // Global shortcut: Ctrl+T to focus tables list
    if (e.ctrlKey && e.key === 't') {
      e.preventDefault();
      focusTablesList();
      return;
    }
    
    // Handle ESC key for dialogs
    if (e.key === 'Escape') {
      // Close help dialog if open
      if (showHelpDialog()) {
        e.preventDefault();
        setShowHelpDialog(false);
        return;
      }
      
      // Close settings dialog if open
      if (showSettings()) {
        e.preventDefault();
        setShowSettings(false);
        return;
      }
      
      // Close connection dialog if open
      if (showConnectionDialog()) {
        e.preventDefault();
        setShowConnectionDialog(false);
        return;
      }
      
      // Close detail sidebar if open (when results table is focused)
      if (activeElement() === 'results-table' && detailSidebarOpen()) {
        e.preventDefault();
        setDetailSidebarOpen(false);
        return;
      }
    }
    
    // Execute query with Ctrl+Enter when in query editor
    if (e.ctrlKey && e.key === 'Enter' && activeElement() === 'query-editor') {
      e.preventDefault();
      const textareaElement = document.querySelector('.query-editor textarea') as HTMLTextAreaElement;
      if (textareaElement && !loading()) {
        executeQuery(textareaElement.value);
      }
    }
    
    // Handle results table navigation
    if (activeElement() === 'results-table' && queryResults()) {
      const results = queryResults();
      if (!results || results.rows.length === 0) return;
      
      const currentIndex = selectedRowIndex() ?? -1;
      const maxIndex = results.rows.length - 1;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < maxIndex) {
            const newIndex = currentIndex + 1;
            handleRowSelect(results.rows[newIndex], newIndex);
          }
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            const newIndex = currentIndex - 1;
            handleRowSelect(results.rows[newIndex], newIndex);
          }
          break;
          
        case ' ': // Spacebar
          e.preventDefault();
          if (currentIndex >= 0) {
            setDetailSidebarOpen(!detailSidebarOpen());
          }
          break;
      }
    }
  }
  
  // Focus the query editor
  function focusQueryEditor() {
    // Try to use the exposed textarea reference first
    if (typeof globalThis !== 'undefined') {
      const textarea = (globalThis as { queryEditorTextarea?: HTMLTextAreaElement }).queryEditorTextarea;
      if (textarea) {
        textarea.focus();
        setActiveElement('query-editor');
        return;
      }
    }
    
    // Fallback to querySelector if the reference is not available
    const queryTextarea = document.querySelector('.query-editor textarea') as HTMLTextAreaElement;
    if (queryTextarea) {
      queryTextarea.focus();
      setActiveElement('query-editor');
    }
  }
  
  // Auto-select first row if results exist
  function selectFirstRow(results: QueryResult) {
    if (results.rows.length > 0) {
      const rowObj = results.rows[0].reduce<Record<string, unknown>>((obj, value, i) => {
        const columnName = results.columns[i] || `column${i}`;
        obj[columnName] = value;
        return obj;
      }, {});
      setSelectedRow(rowObj);
      setSelectedRowIndex(0);
    } else {
      setSelectedRow(null);
      setSelectedRowIndex(null);
    }
  }
  
  // Focus the results table
  function focusResultsTable() {
    // Try to use the exposed table container reference first
    if (typeof globalThis !== 'undefined') {
      const tableContainer = (globalThis as { resultsTableContainer?: HTMLElement }).resultsTableContainer;
      if (tableContainer) {
        // Ensure the element is focusable
        if (tableContainer.getAttribute('tabindex') === null) {
          tableContainer.setAttribute('tabindex', '0');
        }
        tableContainer.focus();
        setActiveElement('results-table');
        
        // Select first row if none selected and results exist
        const results = queryResults();
        if (results && results.rows.length > 0 && selectedRowIndex() === null) {
          selectFirstRow(results);
        }
        return;
      }
    }
    
    // Fallback to querySelector if the reference is not available
    const resultsTable = document.querySelector('.results-table') as HTMLElement;
    if (resultsTable) {
      // Ensure the element is focusable
      if (resultsTable.getAttribute('tabindex') === null) {
        resultsTable.setAttribute('tabindex', '0');
      }
      
      // Focus the element
      resultsTable.focus();
      setActiveElement('results-table');
      
      // Select first row if none selected and results exist
      const results = queryResults();
      if (results && results.rows.length > 0 && selectedRowIndex() === null) {
        selectFirstRow(results);
      }
    }
  }

  // Focus the tables list
  function focusTablesList() {
    // Only focus if there are tables and the list is visible
    if (!tables().length || !tablesVisible()) return;
    
    // Try to use the exposed tables list container reference first
    if (typeof globalThis !== 'undefined') {
      const tablesContainer = (globalThis as { tablesListContainer?: HTMLElement }).tablesListContainer;
      if (tablesContainer) {
        // Ensure the element is focusable
        if (tablesContainer.getAttribute('tabindex') === null) {
          tablesContainer.setAttribute('tabindex', '0');
        }
        
        // Set selected table if none is selected
        if (!selectedTable() && tables().length > 0) {
          setSelectedTable(tables()[0]);
        }
        
        // Focus the container
        tablesContainer.focus();
        setActiveElement('tables-list');
        
        // Trigger an update of the focused index in TablesList via custom event
        const updateEvent = new CustomEvent('update-focused-table', { 
          detail: { selectedTable: selectedTable() }
        });
        globalThis.dispatchEvent(updateEvent);
        
        return;
      }
    }
    
    // Fallback to querySelector if the reference is not available
    const tablesList = document.querySelector('.tables-list') as HTMLElement;
    if (tablesList) {
      // Ensure the element is focusable
      if (tablesList.getAttribute('tabindex') === null) {
        tablesList.setAttribute('tabindex', '0');
      }
      
      // Set selected table if none is selected
      if (!selectedTable() && tables().length > 0) {
        setSelectedTable(tables()[0]);
      }
      
      // Focus the element
      tablesList.focus();
      setActiveElement('tables-list');
      
      // Trigger an update of the focused index in TablesList via custom event
      if (typeof globalThis !== 'undefined') {
        const updateEvent = new CustomEvent('update-focused-table', { 
          detail: { selectedTable: selectedTable() }
        });
        globalThis.dispatchEvent(updateEvent);
      }
    }
  }

  // Initialize app database for storing settings
  async function initAppDb() {
    try {
      // Use a local SQLite database for app settings
      const database = createDatabaseClient({
        type: 'sqlite',
        path: 'tlite_settings.db'
      });
      await database.connect();
      setAppDb(database);
      
      // Check if tables exist before trying to create them
      const tablesResult = await database.executeQuery(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name IN ('connections', 'settings')
      `);
      
      const existingTables = new Set(tablesResult.rows.map(row => row[0]));
      
      // Only create tables if they don't exist
      if (!existingTables.has('connections')) {
        // Create connections table
        await database.executeQuery(`
          CREATE TABLE IF NOT EXISTS connections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            display_name TEXT NOT NULL,
            meta TEXT NOT NULL,
            type TEXT NOT NULL CHECK (type IN ('sqlite', 'libsql')),
            last_used INTEGER NOT NULL,
            UNIQUE(type, meta)
          )
        `);
      }

      if (!existingTables.has('settings')) {
        // Create settings table
        await database.executeQuery(`
          CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
          )
        `);

        // Insert default settings if they don't exist
        const defaultSettings = [
          { key: 'fontSize', value: '14' },
          { key: 'fontFamily', value: 'monospace' },
          { key: 'theme', value: 'light' as ThemeMode }
        ];

        for (const setting of defaultSettings) {
          await database.executeQuery(
            `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`,
            [setting.key, setting.value]
          );
        }
      } else {
        // Make sure all default settings exist even if table already existed
        const defaultSettings = [
          { key: 'fontSize', value: '14' },
          { key: 'fontFamily', value: 'monospace' },
          { key: 'theme', value: 'light' as ThemeMode }
        ];

        for (const setting of defaultSettings) {
          await database.executeQuery(
            `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`,
            [setting.key, setting.value]
          );
        }
      }
      
      // Load recent connections
      await loadRecentConnections();
      // Load settings
      await loadSettings();
    } catch (err) {
      console.error("Error initializing app database:", err);
    }
  }
  
  // Load settings from database
  async function loadSettings() {
    const db = appDb();
    if (!db) return;
    
    try {
      const result = await db.executeQuery(`SELECT key, value FROM settings`);
      
      const loadedSettings: Partial<AppSettings> = {};
      for (const row of result.rows) {
        const key = row[0] as keyof AppSettings;
        const value = row[1] as string;
        if (key === 'theme') {
          loadedSettings[key] = value as 'light' | 'dark' | 'tokyo';
        } else {
          loadedSettings[key] = value;
        }
      }
      
      setSettings(current => ({ ...current, ...loadedSettings }));
    } catch (err) {
      console.error("Error loading settings:", err);
    }
  }

  // Save a setting to the database
  async function saveSetting(key: keyof AppSettings, value: string) {
    const db = appDb();
    if (!db) return;
    
    try {
      await db.executeQuery(
        `UPDATE settings SET value = '${value}' WHERE key = '${key}'`
      );
      
      setSettings(current => ({ ...current, [key]: value }));
    } catch (err) {
      console.error("Error saving setting:", err);
    }
  }

  // Toggle settings menu
  function toggleSettings() {
    setShowSettings(!showSettings());
  }

  // Load recent connections from app database
  async function loadRecentConnections() {
    const db = appDb();
    if (!db) return;
    
    try {
      console.log("Attempting to load recent connections...");
      
      const result = await db.executeQuery(`
        SELECT display_name, meta, type, last_used
        FROM connections
        ORDER BY last_used DESC
        LIMIT 10
      `);
      
      console.log(`Found ${result.rows.length} connections in the database`);
      
      // Map the results to ConnectionHistory objects
      const connections: ConnectionHistory[] = result.rows.map(row => {
        const displayName = row[0] as string;
        const metaStr = row[1] as string;
        const type = row[2] as 'sqlite' | 'libsql';
        const lastAccessed = Number(row[3]);
        
        console.log(`Connection: ${displayName}, type: ${type}, meta: ${metaStr}`);
        
        try {
          const meta = JSON.parse(metaStr);
          
          return {
            name: type === 'sqlite' ? meta.path : meta.url,
            type,
            meta: metaStr,
            lastAccessed
          };
        } catch (err) {
          console.error(`Error parsing meta JSON for connection ${displayName}:`, err);
          return null;
        }
      }).filter(Boolean) as ConnectionHistory[];
      
      console.log(`Loaded ${connections.length} valid connections`);
      setRecentConnections(connections);
    } catch (err) {
      console.error("Error loading recent connections:", err);
    }
  }
  
  // Connect to database
  async function connectToDatabase() {
    setLoading(true);
    setError("");
    try {
      console.log(`Connecting to ${connectionType()} database...`);
      console.log(`Settings: ${connectionType() === 'sqlite' ? `Path: ${dbPath()}` : `URL: ${libsqlUrl()}, AuthToken: ${authToken() ? '***' : 'none'}`}`);
      
      // Validate input parameters
      if (connectionType() === 'sqlite' && !dbPath().trim()) {
        throw new Error("Please enter a valid SQLite database path");
      }
      
      if (connectionType() === 'libsql') {
        if (!libsqlUrl().trim()) {
          throw new Error("Please enter a valid LibSQL URL");
        }
        
        // Validate URL format for LibSQL
        try {
          new URL(libsqlUrl());
        } catch (e) {
          throw new Error("Please enter a valid URL format (e.g., https://example.turso.io)");
        }
        
        // Auth token required for remote LibSQL databases
        if (!libsqlUrl().includes("localhost") && !libsqlUrl().includes("127.0.0.1") && !authToken().trim()) {
          throw new Error("Auth token is required for remote LibSQL databases");
        }
      }
      
      // Create and connect to the database
      const client = createDatabaseClient({
        type: connectionType(),
        ...(connectionType() === 'sqlite' 
          ? { path: dbPath() }
          : { url: libsqlUrl(), authToken: authToken() }
        )
      });
      
      await client.connect();
      setDbClient(client);
      
      // Get table names
      const tableNames = await client.getTables();
      console.log(`Found ${tableNames.length} tables: ${tableNames.join(', ')}`);
      setTables(tableNames);
      
      if (tableNames.length > 0) {
        setSelectedTable(tableNames[0]);
      }
      
      setConnected(true);
      setShowConnectionDialog(false);
      
      // Save to connection history with proper meta data
      const name = connectionType() === 'sqlite' ? dbPath() : libsqlUrl();
      const displayName = connectionType() === 'sqlite' 
        ? name.split('/').pop() || name
        : new URL(name).hostname;
      const meta = connectionType() === 'sqlite'
        ? JSON.stringify({ path: dbPath() })
        : JSON.stringify({ 
            url: libsqlUrl(),
            authToken: authToken() || null
          });
      
      console.log(`Saving connection: ${displayName}, type: ${connectionType()}, meta: ${meta}`);
      
      // Insert or update connection
      const db = appDb();
      if (db) {
        console.log("App DB available, saving connection to history");
        await db.executeQuery(
          `INSERT INTO connections (display_name, meta, type, last_used)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(type, meta) 
           DO UPDATE SET 
           last_used = excluded.last_used,
           display_name = excluded.display_name`,
          [displayName, meta, connectionType(), Math.floor(new Date().getTime())]
        );
        
        // Reload connections
        await loadRecentConnections();
      } else {
        console.error("App DB not available, cannot save connection to history");
      }
      
      // Focus on the table list after successful connection
      setTimeout(() => {
        focusTablesList();
      }, 100); // Small delay to ensure UI has updated
    } catch (err) {
      console.error("Error connecting to database:", err);
      
      // Display a more user-friendly error message
      let errorMessage = err instanceof Error ? err.message : String(err);
      
      // Add help text for common errors
      if (connectionType() === 'libsql' && errorMessage.includes("Auth")) {
        errorMessage += "\n\nFor Turso databases, you can generate an auth token in the Turso dashboard or CLI.";
      }
      
      setError(errorMessage);
      setConnected(false);
      setTables([]);
    } finally {
      setLoading(false);
    }
  }

  // Handle recent connection selection
  function handleRecentConnectionSelect(connection: ConnectionHistory) {
    setConnectionType(connection.type);
    if (connection.type === 'sqlite') {
      const meta = JSON.parse(connection.meta);
      setDbPath(meta.path);
    } else {
      const meta = JSON.parse(connection.meta);
      setLibsqlUrl(meta.url);
      setAuthToken(meta.authToken || '');
    }
    connectToDatabase();
  }

  // Execute SQL query
  async function executeQuery(query: string) {
    const client = dbClient();
    if (!client) return;
    
    setLoading(true);
    setError("");
    try {
      console.log(`Executing query: ${query.substring(0, 100)}${query.length > 100 ? '...' : ''}`);
      
      const result = await client.executeQuery(query);
      console.log(`Query returned ${result.rows.length} rows with ${result.columns.length} columns`);
      
      setQueryResults(result);
      
      // Store current sidebar state
      const wasSidebarOpen = detailSidebarOpen();
      
      // Auto-select the first row if results exist
      if (result.rows.length > 0) {
        const rowObj = result.rows[0].reduce<Record<string, unknown>>((obj, value, i) => {
          const columnName = result.columns[i] || `column${i}`;
          obj[columnName] = value;
          return obj;
        }, {});
        
        setSelectedRow(rowObj);
        setSelectedRowIndex(0);
      } else {
        setSelectedRow(null);
        setSelectedRowIndex(null);
      }
      
      // Restore previous sidebar state instead of always opening it
      setDetailSidebarOpen(wasSidebarOpen);
      
      // Focus the results table after query execution
      setTimeout(() => {
        focusResultsTable();
      }, 100);
    } catch (err) {
      console.error("Error executing query:", err);
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
      setQueryResults(null);
      setSelectedRow(null);
      setSelectedRowIndex(null);
    } finally {
      setLoading(false);
    }
  }

  // Handle table selection
  function handleTableSelect(table: string, triggerQueryExecution: boolean = true) {
    setSelectedTable(table);
    
    // Only execute the query if explicitly requested
    if (triggerQueryExecution) {
      executeQuery(`SELECT * FROM ${table} LIMIT 100`);
    }
  }
  
  // Handle row selection
  function handleRowSelect(row: unknown[], index: number) {
    const rowObj = row.reduce<Record<string, unknown>>((obj, value, i) => {
      const columnName = queryResults()?.columns[i] || `column${i}`;
      obj[columnName] = value;
      return obj;
    }, {});
    
    setSelectedRow(rowObj);
    setSelectedRowIndex(index);
    
    // Don't automatically open the sidebar
    // Only open it if it's already open or if the user explicitly toggles it
  }
  
  // Toggle detail sidebar
  function toggleDetailSidebar() {
    setDetailSidebarOpen(!detailSidebarOpen());
  }
  
  // Toggle tables sidebar
  function toggleTablesSidebar() {
    setTablesVisible(!tablesVisible());
  }
  
  // Toggle connection dialog
  function toggleConnectionDialog() {
    // Set the latest values if already connected
    if (connected()) {
      const client = dbClient();
      if (client && client.config) {
        setConnectionType(client.config.type);
        if (client.config.type === 'sqlite' && client.config.path) {
          setDbPath(client.config.path);
        } else if (client.config.type === 'libsql' && client.config.url) {
          setLibsqlUrl(client.config.url);
          setAuthToken(client.config.authToken || '');
        }
      }
    }
    
    setShowConnectionDialog(!showConnectionDialog());
  }

  // Toggle help dialog
  function toggleHelpDialog() {
    setShowHelpDialog(!showHelpDialog());
  }

  // Get scrollbar style class based on theme
  const getScrollbarClass = () => {
    if (settings().theme === 'tokyo') {
      return 'tokyo-scrollbar';
    }
    return '';
  };

  return (
    <div 
      class={`flex flex-col h-screen ${themeColors[settings().theme].background} ${themeColors[settings().theme].text} ${getScrollbarClass()}`}
      style={{
        "font-family": settings().fontFamily,
        "font-size": `${settings().fontSize}px`
      }}
    >
      {/* Show error message if any */}
      <Show when={error()}>
        <div class={`p-2 bg-red-600 text-white`}>
          {error()}
        </div>
      </Show>

      {/* Main content area */}
      <div class="flex-1 flex overflow-hidden">
        {/* Main navigation sidebar */}
        <TableSidebar 
          tables={tables()} 
          selectedTable={selectedTable()} 
          onSelectTable={handleTableSelect} 
          theme={settings().theme}
          onToggleSettings={toggleSettings}
          onToggleHelp={toggleHelpDialog}
          dbPath={dbPath()}
          onDbPathChange={setDbPath}
          onConnect={toggleConnectionDialog}
          isLoading={loading()}
          isConnected={connected()}
          onToggleTables={toggleTablesSidebar}
          tablesVisible={tablesVisible()}
          onReload={connectToDatabase}
        />
        
        {/* Tables sidebar (collapsible) */}
        <TablesList
          tables={tables()}
          selectedTable={selectedTable()}
          onSelectTable={handleTableSelect}
          theme={settings().theme}
          isVisible={tablesVisible() && connected()}
        />
        
        {/* Main content */}
        <Show when={connected()} fallback={
          <div class="flex-1 flex items-center justify-center p-4">
            <div class={`text-center p-6 w-full max-w-2xl ${themeColors[settings().theme].background} ${themeColors[settings().theme].text} border ${themeColors[settings().theme].border} rounded-lg shadow-lg`}>
              <h2 class="text-2xl font-bold mb-4">Welcome to SQLite Explorer</h2>
              <p class={`${themeColors[settings().theme].subText} mb-6`}>Click the database icon to connect to a SQLite or LibSQL database</p>
              
              {/* Recent connections */}
              <Show when={recentConnections().length > 0}>
                <div class="mt-8">
                  <h3 class="text-lg font-medium mb-3">Recent Connections</h3>
                  <div class={`border ${themeColors[settings().theme].border} rounded-md overflow-hidden w-full`}>
                    <ul class={`divide-y ${themeColors[settings().theme].divider}`}>
                      <For each={recentConnections()}>
                        {(connection: ConnectionHistory) => {
                          console.log("Rendering connection:", connection);
                          
                          // Helper functions for display
                          const getDisplayName = () => {
                            try {
                              return connection.type === 'sqlite' 
                                ? connection.name.split('/').pop() || connection.name
                                : new URL(connection.name).hostname;
                            } catch (err) {
                              console.error("Error parsing connection name:", err);
                              return "Unknown";
                            }
                          };
                          
                          return (
                            <li>
                              <button
                                type="button"
                                onClick={() => handleRecentConnectionSelect(connection)}
                                class={`w-full text-left px-4 py-3 ${themeColors[settings().theme].hover} flex items-center`}
                              >
                                <div class="flex-1">
                                  <div class={`font-medium ${themeColors[settings().theme].headerText}`}>
                                    {getDisplayName()}
                                  </div>
                                  <div class={`text-sm ${themeColors[settings().theme].subText} break-all`}>
                                    {connection.name}
                                  </div>
                                  <div class={`text-xs ${themeColors[settings().theme].subText} mt-1`}>
                                    {connection.type === 'sqlite' ? 'SQLite' : 'LibSQL'}
                                  </div>
                                </div>
                              </button>
                            </li>
                          );
                        }}
                      </For>
                    </ul>
                  </div>
                </div>
              </Show>
            </div>
          </div>
        }>
          <div class="flex-1 p-4 overflow-auto flex flex-col">
            {/* Query editor */}
            <QueryEditor 
              onExecuteQuery={executeQuery} 
              isLoading={loading()}
              selectedTable={selectedTable()}
              theme={settings().theme}
              fontSize={settings().fontSize}
              fontFamily={settings().fontFamily}
            />
            
            {/* Results table with integrated toggle button */}
            <ResultsTable 
              results={queryResults()} 
              onRowSelect={handleRowSelect}
              selectedRowIndex={selectedRowIndex()}
              onToggleDetailSidebar={toggleDetailSidebar}
              detailSidebarOpen={detailSidebarOpen()}
              theme={settings().theme}
              fontSize={settings().fontSize}
              fontFamily={settings().fontFamily}
            />
          </div>
        </Show>
        
        {/* Row detail sidebar */}
        <RowDetailSidebar
          row={selectedRow()}
          isOpen={detailSidebarOpen()}
          onClose={() => setDetailSidebarOpen(false)}
          theme={settings().theme}
          fontFamily={settings().fontFamily}
          fontSize={settings().fontSize}
          selectedRowIndex={selectedRowIndex()}
        />
      </div>

      {/* Connection Dialog */}
      <ConnectionDialog
        dbPath={dbPath()}
        onDbPathChange={setDbPath}
        libsqlUrl={libsqlUrl()}
        onLibsqlUrlChange={setLibsqlUrl}
        authToken={authToken()}
        onAuthTokenChange={setAuthToken}
        connectionType={connectionType()}
        onConnectionTypeChange={setConnectionType}
        onConnect={connectToDatabase}
        isLoading={loading()}
        isConnected={connected()}
        theme={settings().theme}
        recentConnections={recentConnections()}
        onSelectRecent={handleRecentConnectionSelect}
        isOpen={showConnectionDialog()}
        onClose={() => setShowConnectionDialog(false)}
      />

      {/* Settings Menu */}
      <SettingsMenu
        settings={settings()}
        onSave={saveSetting}
        onClose={() => setShowSettings(false)}
        isOpen={showSettings()}
      />
      
      {/* Help Dialog */}
      <HelpDialog
        isOpen={showHelpDialog()}
        onClose={() => setShowHelpDialog(false)}
        theme={settings().theme}
      />
    </div>
  );
}

export default App;
