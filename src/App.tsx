import { createSignal, Show, createEffect, onMount } from "solid-js";
import Database from "@tauri-apps/plugin-sql";
import { TableRow, QueryResult, ConnectionHistory, AppSettings } from "./types";
import TableSidebar from "./components/TableSidebar";
import TablesList from "./components/TablesList";
import ConnectionDialog from "./components/ConnectionDialog";
import QueryEditor from "./components/QueryEditor";
import ResultsTable from "./components/ResultsTable";
import RowDetailSidebar from "./components/RowDetailSidebar";
import SettingsMenu from "./components/SettingsMenu";

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
  const [tablesVisible, setTablesVisible] = createSignal(true);
  
  // Row detail sidebar state
  const [selectedRow, setSelectedRow] = createSignal<Record<string, unknown> | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = createSignal<number | null>(null);
  const [detailSidebarOpen, setDetailSidebarOpen] = createSignal(false);

  // Initialize app on mount
  onMount(() => {
    initAppDb();
  });

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
  function handleTableSelect(table: string) {
    setSelectedTable(table);
    executeQuery(`SELECT * FROM ${table} LIMIT 100`);
  }
  
  // Handle row selection
  function handleRowSelect(row: Record<string, unknown>) {
    const results = queryResults();
    if (!results) return;
    
    const index = results.rows.findIndex(r => r === row);
    setSelectedRow(row);
    setSelectedRowIndex(index);
  }
  
  // Toggle detail sidebar
  function toggleDetailSidebar() {
    setDetailSidebarOpen(!detailSidebarOpen());
  }
  
  // Handle selecting a recent connection
  function handleSelectRecentConnection(path: string) {
    setDbPath(path);
    connectToDatabase();
  }
  
  // Toggle tables sidebar
  function toggleTablesSidebar() {
    setTablesVisible(!tablesVisible());
  }
  
  // Toggle connection dialog
  function toggleConnectionDialog() {
    setShowConnectionDialog(!showConnectionDialog());
  }

  return (
    <div 
      class={`flex flex-col h-screen ${settings().theme === 'dark' ? 'bg-black text-gray-100' : 'bg-white text-gray-900'}`}
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
          <div class="flex-1 flex items-center justify-center">
            <div class={`text-center p-8 max-w-md ${settings().theme === 'dark' ? 'bg-black text-white border border-gray-800' : 'bg-white'} rounded-lg shadow-lg`}>
              <h2 class="text-2xl font-bold mb-4">Welcome to SQLite Explorer</h2>
              <p class={`${settings().theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-4`}>Click the database icon to connect to a SQLite database</p>
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

      {/* Footer */}
      <footer class={`${settings().theme === 'dark' ? 'bg-black border-gray-900 text-gray-600' : 'bg-gray-100 border-gray-200 text-gray-600'} border-t p-2 text-center text-sm`}>
        Tauri SQLite Explorer
      </footer>
    </div>
  );
}

export default App;
