import { createSignal, Show, createEffect, onMount, onCleanup, For } from "solid-js";
import Database from "@tauri-apps/plugin-sql";
import { TableRow, QueryResult, ConnectionHistory, AppSettings } from "./types.ts";
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

function App() {
  const [dbPath, setDbPath] = createSignal("/home/fightbulc/Buildspace/code/ato/subs/data/dump.sqlite");
  const [db, setDb] = createSignal<Database | null>(null);
  const [appDb, setAppDb] = createSignal<Database | null>(null);
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
  const [activeElement, setActiveElement] = createSignal<string | null>(null);

  // Initialize app on mount
  onMount(() => {
    initAppDb();
    
    // Set up global keyboard event listeners
    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('focusin', handleFocusChange);
    
    onCleanup(() => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('focusin', handleFocusChange);
    });

    // Make focusQueryEditor available globally
    if (typeof window !== 'undefined') {
      (window as any).focusQueryEditor = focusQueryEditor;
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
            setSelectedRow(results.rows[newIndex]);
            setSelectedRowIndex(newIndex);
          }
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            const newIndex = currentIndex - 1;
            setSelectedRow(results.rows[newIndex]);
            setSelectedRowIndex(newIndex);
          }
          break;
          
        case ' ': // Spacebar
          e.preventDefault();
          if (currentIndex >= 0) {
            toggleDetailSidebar();
          }
          break;
      }
    }
  }
  
  // Focus the query editor
  function focusQueryEditor() {
    // Try to use the exposed textarea reference first
    if (typeof window !== 'undefined' && (window as any).queryEditorTextarea) {
      const textarea = (window as any).queryEditorTextarea;
      textarea.focus();
      setActiveElement('query-editor');
      return;
    }
    
    // Fallback to querySelector if the reference is not available
    const queryTextarea = document.querySelector('.query-editor textarea') as HTMLTextAreaElement;
    if (queryTextarea) {
      queryTextarea.focus();
      setActiveElement('query-editor');
    }
  }
  
  // Focus the results table
  function focusResultsTable() {
    // Try to use the exposed table container reference first
    if (typeof window !== 'undefined' && (window as any).resultsTableContainer) {
      const tableContainer = (window as any).resultsTableContainer;
      // Ensure the element is focusable
      if (tableContainer.getAttribute('tabindex') === null) {
        tableContainer.setAttribute('tabindex', '0');
      }
      tableContainer.focus();
      setActiveElement('results-table');
      
      // Select first row if none selected and results exist
      const results = queryResults();
      if (results && results.rows.length > 0 && selectedRowIndex() === null) {
        setSelectedRow(results.rows[0]);
        setSelectedRowIndex(0);
      }
      return;
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
        setSelectedRow(results.rows[0]);
        setSelectedRowIndex(0);
      }
    }
  }

  // Focus the tables list
  function focusTablesList() {
    // Only focus if there are tables and the list is visible
    if (!tables().length || !tablesVisible()) return;
    
    // Try to use the exposed tables list container reference first
    if (typeof window !== 'undefined' && (window as any).tablesListContainer) {
      const tablesContainer = (window as any).tablesListContainer;
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
      if (typeof window !== 'undefined') {
        const updateEvent = new CustomEvent('update-focused-table', { 
          detail: { selectedTable: selectedTable() }
        });
        window.dispatchEvent(updateEvent);
      }
      
      return;
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
      if (typeof window !== 'undefined') {
        const updateEvent = new CustomEvent('update-focused-table', { 
          detail: { selectedTable: selectedTable() }
        });
        window.dispatchEvent(updateEvent);
      }
    }
  }

  // Load settings from database
  async function loadSettings() {
    const db = appDb();
    if (!db) return;
    
    try {
      const results = await db.select<{ key: string; value: string }[]>(`
        SELECT key, value FROM settings
      `);
      
      const loadedSettings: Partial<AppSettings> = {};
      for (const row of results) {
        loadedSettings[row.key as keyof AppSettings] = row.value as any;
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
      await db.execute(`
        UPDATE settings
        SET value = ?
        WHERE key = ?
      `, [value, key]);
      
      setSettings(current => ({ ...current, [key]: value }));
    } catch (err) {
      console.error("Error saving setting:", err);
    }
  }

  // Toggle settings menu
  function toggleSettings() {
    setShowSettings(!showSettings());
  }

  // Initialize app database for storing settings
  async function initAppDb() {
    try {
      // Use a local SQLite database for app settings
      const database = await Database.load("sqlite:tlite_settings.db");
      setAppDb(database);
      
      // Create tables if they don't exist
      await database.execute(`
        CREATE TABLE IF NOT EXISTS connections (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          path TEXT NOT NULL UNIQUE,
          last_used TEXT NOT NULL
        )
      `);

      // Create settings table
      await database.execute(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `);

      // Insert default settings if they don't exist
      const defaultSettings = [
        { key: 'fontSize', value: '14' },
        { key: 'fontFamily', value: 'monospace' },
        { key: 'theme', value: 'light' }
      ];

      for (const setting of defaultSettings) {
        await database.execute(`
          INSERT OR IGNORE INTO settings (key, value)
          VALUES (?, ?)
        `, [setting.key, setting.value]);
      }
      
      // Load recent connections
      await loadRecentConnections();
      // Load settings
      await loadSettings();
    } catch (err) {
      console.error("Error initializing app database:", err);
    }
  }
  
  // Load recent connections from app database
  async function loadRecentConnections() {
    const db = appDb();
    if (!db) return;
    
    try {
      const connections = await db.select<ConnectionHistory[]>(`
        SELECT id, path, last_used FROM connections
        ORDER BY last_used DESC
        LIMIT 5
      `);
      
      setRecentConnections(connections);
    } catch (err) {
      console.error("Error loading recent connections:", err);
    }
  }
  
  // Save connection to history
  async function saveConnectionToHistory(path: string) {
    const db = appDb();
    if (!db) return;
    
    try {
      const now = new Date().toISOString();
      
      // Insert or update connection
      await db.execute(`
        INSERT INTO connections (path, last_used)
        VALUES (?, ?)
        ON CONFLICT(path) DO UPDATE SET last_used = ?
      `, [path, now, now]);
      
      // Reload connections
      await loadRecentConnections();
    } catch (err) {
      console.error("Error saving connection to history:", err);
    }
  }

  // Connect to database
  async function connectToDatabase() {
    setLoading(true);
    setError("");
    try {
      // Connect to the SQLite database
      const database = await Database.load(`sqlite:${dbPath()}`);
      setDb(database);
      
      // Query to get all table names
      const result = await database.select<TableRow[]>(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
      );
      
      // Extract table names from the result
      const tableNames = result.map((row: TableRow) => row.name);
      setTables(tableNames);
      
      if (tableNames.length > 0) {
        setSelectedTable(tableNames[0]);
      }
      
      setConnected(true);
      
      // Save to connection history
      await saveConnectionToHistory(dbPath());
      
      // Focus on the table list after successful connection
      setTimeout(() => {
        focusTablesList();
      }, 100); // Small delay to ensure UI has updated
    } catch (err) {
      console.error("Error connecting to database:", err);
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
      setTables([]);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }

  // Execute SQL query
  async function executeQuery(query: string) {
    if (!db()) return;
    
    setLoading(true);
    setError("");
    try {
      const result = await db()!.select<Record<string, unknown>[]>(query);
      
      // Extract column names from the first row
      const columns = result.length > 0 
        ? Object.keys(result[0]) 
        : [];
      
      setQueryResults({
        columns,
        rows: result
      });
      
      // Reset row selection when query changes, but preserve sidebar state
      const wasSidebarOpen = detailSidebarOpen();
      
      // Auto-select the first row if results exist
      if (result.length > 0) {
        setSelectedRow(result[0]);
        setSelectedRowIndex(0);
      } else {
        setSelectedRow(null);
        setSelectedRowIndex(null);
      }
      
      // Only close sidebar if it was previously closed
      if (!wasSidebarOpen) {
        setDetailSidebarOpen(false);
      }
      
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
  function handleRowSelect(row: Record<string, unknown>) {
    const results = queryResults();
    if (!results) return;
    
    // Find the index of the selected row
    const index = results.rows.findIndex(r => {
      // Compare objects by reference
      return r === row;
    });
    
    // Only update if the row is actually found
    if (index !== -1) {
      setSelectedRow(row);
      setSelectedRowIndex(index);
    }
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
    setShowConnectionDialog(!showConnectionDialog());
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
              <p class={`${themeColors[settings().theme].subText} mb-6`}>Click the database icon to connect to a SQLite database</p>
              
              {/* Recent connections */}
              <Show when={recentConnections().length > 0}>
                <div class="mt-8">
                  <h3 class="text-lg font-medium mb-3">Recent Connections</h3>
                  <div class={`border ${themeColors[settings().theme].border} rounded-md overflow-hidden w-full`}>
                    <ul class={`divide-y ${themeColors[settings().theme].divider}`}>
                      <For each={recentConnections()}>
                        {(connection: ConnectionHistory) => (
                          <li>
                            <button
                              onClick={() => {
                                setDbPath(connection.path);
                                connectToDatabase();
                              }}
                              class={`w-full text-left px-4 py-3 ${themeColors[settings().theme].hover} flex items-center`}
                            >
                              <div class="flex-1">
                                <div class={`font-medium ${themeColors[settings().theme].headerText}`}>
                                  {connection.path.split('/').pop()}
                                </div>
                                <div class={`text-sm ${themeColors[settings().theme].subText} break-all`}>
                                  {connection.path}
                                </div>
                              </div>
                            </button>
                          </li>
                        )}
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
        onConnect={() => {
          connectToDatabase();
          setShowConnectionDialog(false);
        }}
        isLoading={loading()}
        isConnected={connected()}
        theme={settings().theme}
        recentConnections={recentConnections()}
        onSelectRecent={(path) => {
          setDbPath(path);
          connectToDatabase();
          setShowConnectionDialog(false);
        }}
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
