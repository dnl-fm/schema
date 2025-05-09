import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { AppSettings, ConnectionHistory, QueryResult, DatabaseConfig } from "./types.ts";
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
import { RecentConnections } from "./components/RecentConnections.tsx";
import AppHeader from "./components/AppHeader.tsx";
import ActiveConnectionIndicator from "./components/ActiveConnectionIndicator.tsx";

type ActiveElement = "query-editor" | "results-table" | "tables-list" | null;

function App() {
  const [dbPath, setDbPath] = createSignal<string>("");
  const [libsqlUrl, setLibsqlUrl] = createSignal<string>("");
  const [authToken, setAuthToken] = createSignal<string>("");
  const [connectionType, setConnectionType] = createSignal<"sqlite" | "libsql">(
    "sqlite",
  );
  const [dbClient, setDbClient] = createSignal<DatabaseClient | null>(null);
  const [appDb, setAppDb] = createSignal<DatabaseClient | null>(null);
  const [tables, setTables] = createSignal<string[]>([]);
  const [selectedTable, setSelectedTable] = createSignal("");
  const [queryResults, setQueryResults] = createSignal<QueryResult | null>(
    null,
  );
  const [error, setError] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [connected, setConnected] = createSignal(false);
  const [recentConnections, setRecentConnections] = createSignal<
    ConnectionHistory[]
  >([]);
  const [savedConnections, setSavedConnections] = createSignal<
    ConnectionHistory[]
  >([]);
  const [settings, setSettings] = createSignal<AppSettings>({
    fontSize: "14",
    fontFamily: "monospace",
    theme: "light",
  });
  const [showSettings, setShowSettings] = createSignal(false);
  const [showConnectionDialog, setShowConnectionDialog] = createSignal(false);
  const [showHelpDialog, setShowHelpDialog] = createSignal(false);
  const [tablesVisible, setTablesVisible] = createSignal(true);

  // Row detail sidebar state
  const [selectedRow, setSelectedRow] = createSignal<
    Record<string, unknown> | null
  >(null);
  const [selectedRowIndex, setSelectedRowIndex] = createSignal<number | null>(
    null,
  );
  const [detailSidebarOpen, setDetailSidebarOpen] = createSignal(false);

  // Track active element for keyboard shortcuts
  const [activeElement, setActiveElement] = createSignal<ActiveElement>(null);

  // Application state
  const [isEditing, setIsEditing] = createSignal(false);

  // Initialize app on mount
  onMount(async () => {
    // Initialize database first before setting up other event listeners
    await initAppDb();

    // Set up global keyboard event listeners
    globalThis.addEventListener("keydown", handleGlobalKeyDown);
    globalThis.addEventListener("focusin", handleFocusChange);

    onCleanup(() => {
      globalThis.removeEventListener("keydown", handleGlobalKeyDown);
      globalThis.removeEventListener("focusin", handleFocusChange);
    });

    // Make focusQueryEditor available globally
    if (typeof globalThis !== "undefined") {
      (globalThis as { focusQueryEditor?: () => void }).focusQueryEditor =
        focusQueryEditor;
      
      // Make app database and functions available in the global object
      (window as any).appDbInstance = () => appDb();
      (window as any).reloadConnections = async () => {
        console.log("Global reloadConnections called");
        return loadRecentConnections();
      };
      (window as any).toggleConnectionDialog = toggleConnectionDialog;
    }
  });

  // Handle focus changes to track active element
  function handleFocusChange(e: FocusEvent) {
    const target = e.target as HTMLElement;

    if (target.tagName === "TEXTAREA" && target.closest(".query-editor")) {
      setActiveElement("query-editor");
    } else if (
      target.closest(".results-table") ||
      target.classList.contains("results-table")
    ) {
      setActiveElement("results-table");
    } else if (
      target.closest(".tables-list") || target.classList.contains("tables-list")
    ) {
      setActiveElement("tables-list");
    } else {
      setActiveElement(null);
    }
  }

  // Global shortcuts for recent connections
  function getKeyboardShortcutConnections() {
    // Only return the first 5 most recent connections for keyboard shortcuts
    return recentConnections().slice(0, 5);
  }

  // Global keyboard event handler
  function handleGlobalKeyDown(e: KeyboardEvent) {
    // Skip events inside input elements
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    // Global shortcut: Ctrl+K to show connection dialog
    if (e.ctrlKey && e.key === "k") {
      e.preventDefault();
      toggleConnectionDialog();
      return;
    }

    // Global shortcut: Ctrl+[1-5] to open recent connections
    if (e.ctrlKey && e.key >= "1" && e.key <= "5") {
      e.preventDefault();
      const connectionIndex = parseInt(e.key) - 1;
      const connections = getKeyboardShortcutConnections();
      
      if (connections.length > connectionIndex) {
        handleRecentConnectionSelect(connections[connectionIndex]);
      }
      return;
    }

    // Global shortcut: Ctrl+H to show help dialog
    if (e.ctrlKey && e.key === "h") {
      e.preventDefault();
      setShowHelpDialog(true);
      return;
    }

    // Global shortcut: Ctrl+S to show start page (home)
    if (e.ctrlKey && e.key === "s") {
      e.preventDefault();
      disconnectAndShowHome();
      return;
    }

    // Global shortcut: Ctrl+X to show settings (remapped from Ctrl+S)
    if (e.ctrlKey && e.key === "x") {
      e.preventDefault();
      toggleSettings();
      return;
    }

    // Global shortcut: Ctrl+Q to focus query editor
    if (e.ctrlKey && e.key === "q") {
      e.preventDefault();
      focusQueryEditor();
      return;
    }

    // Global shortcut: Ctrl+R to focus results table
    if (e.ctrlKey && e.key === "r") {
      e.preventDefault();
      focusResultsTable();
      return;
    }

    // Global shortcut: Ctrl+T to focus tables list
    if (e.ctrlKey && e.key === "t") {
      e.preventDefault();

      if (activeElement() === "tables-list" && tablesVisible()) {
        // If tables list is focused and visible, hide it
        setTablesVisible(false);
      } else {
        // If tables list is hidden or not focused, show it and focus it
        setTablesVisible(true);

        // We need to give enough time for the component to render
        // and register its containerRef with globalThis
        setTimeout(() => {
          // Ensure the tables list is properly focused after becoming visible
          const listElement = document.querySelector(".tables-list");
          if (listElement) {
            (listElement as HTMLElement).focus();
            setActiveElement("tables-list");

            // Also manually trigger a focus update to highlight the selected item
            if (typeof globalThis !== "undefined") {
              const updateEvent = new CustomEvent("update-focused-table", {
                detail: { selectedTable: selectedTable() },
              });
              globalThis.dispatchEvent(updateEvent);
            }
          }
        }, 150); // Increased delay for DOM updates
      }
      return;
    }

    // Handle ESC key for dialogs
    if (e.key === "Escape") {
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
      if (activeElement() === "results-table" && detailSidebarOpen()) {
        e.preventDefault();
        setDetailSidebarOpen(false);
        return;
      }
    }

    // Execute query with Ctrl+Enter when in query editor
    if (e.ctrlKey && e.key === "Enter" && activeElement() === "query-editor") {
      e.preventDefault();
      const textareaElement = document.querySelector(
        ".query-editor textarea",
      ) as HTMLTextAreaElement;
      if (textareaElement && !loading()) {
        executeQuery(textareaElement.value);
      }
    }

    // Handle results table navigation
    if (activeElement() === "results-table" && queryResults()) {
      const results = queryResults();
      if (!results || results.rows.length === 0) return;

      const currentIndex = selectedRowIndex() ?? -1;
      const maxIndex = results.rows.length - 1;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (currentIndex < maxIndex) {
            const newIndex = currentIndex + 1;
            handleRowSelect(results.rows[newIndex], newIndex);
          }
          break;

        case "ArrowUp":
          e.preventDefault();
          if (currentIndex > 0) {
            const newIndex = currentIndex - 1;
            handleRowSelect(results.rows[newIndex], newIndex);
          }
          break;

        case " ": // Spacebar
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
    if (typeof globalThis !== "undefined") {
      const textarea =
        (globalThis as { queryEditorTextarea?: HTMLTextAreaElement })
          .queryEditorTextarea;
      if (textarea) {
        textarea.focus();
        setActiveElement("query-editor");
        return;
      }
    }

    // Fallback to querySelector if the reference is not available
    const queryTextarea = document.querySelector(
      ".query-editor textarea",
    ) as HTMLTextAreaElement;
    if (queryTextarea) {
      queryTextarea.focus();
      setActiveElement("query-editor");
    }
  }

  // Auto-select first row if results exist
  function selectFirstRow(results: QueryResult) {
    if (results.rows.length > 0) {
      const rowObj = results.rows[0].reduce<Record<string, unknown>>(
        (obj, value, i) => {
          const columnName = results.columns[i] || `column${i}`;
          obj[columnName] = value;
          return obj;
        },
        {},
      );
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
    if (typeof globalThis !== "undefined") {
      const tableContainer =
        (globalThis as { resultsTableContainer?: HTMLElement })
          .resultsTableContainer;
      if (tableContainer) {
        // Ensure the element is focusable
        if (tableContainer.getAttribute("tabindex") === null) {
          tableContainer.setAttribute("tabindex", "0");
        }
        tableContainer.focus();
        setActiveElement("results-table");

        // Select first row if none selected and results exist
        const results = queryResults();
        if (results && results.rows.length > 0 && selectedRowIndex() === null) {
          selectFirstRow(results);
        }
        return;
      }
    }

    // Fallback to querySelector if the reference is not available
    const resultsTable = document.querySelector(
      ".results-table",
    ) as HTMLElement;
    if (resultsTable) {
      // Ensure the element is focusable
      if (resultsTable.getAttribute("tabindex") === null) {
        resultsTable.setAttribute("tabindex", "0");
      }

      // Focus the element
      resultsTable.focus();
      setActiveElement("results-table");

      // Select first row if none selected and results exist
      const results = queryResults();
      if (results && results.rows.length > 0 && selectedRowIndex() === null) {
        selectFirstRow(results);
      }
    }
  }

  // Focus the tables list
  function focusTablesList() {
    // Check for tables but don't return early if the list isn't visible yet
    // as we might be in the process of making it visible
    if (!tables().length) return;

    // Set a retry counter for cases where the DOM hasn't updated yet
    let attempts = 0;
    const maxAttempts = 5;

    const attemptFocus = () => {
      // Try to use the exposed tables list container reference first
      if (typeof globalThis !== "undefined") {
        const tablesContainer =
          (globalThis as { tablesListContainer?: HTMLElement })
            .tablesListContainer;
        if (tablesContainer) {
          // Ensure the element is focusable
          if (tablesContainer.getAttribute("tabindex") === null) {
            tablesContainer.setAttribute("tabindex", "0");
          }

          // Set selected table if none is selected
          if (!selectedTable() && tables().length > 0) {
            setSelectedTable(tables()[0]);
          }

          // Focus the container
          tablesContainer.focus();
          setActiveElement("tables-list");

          // Trigger an update of the focused index in TablesList via custom event
          const updateEvent = new CustomEvent("update-focused-table", {
            detail: { selectedTable: selectedTable() },
          });
          globalThis.dispatchEvent(updateEvent);

          return true;
        }
      }

      // Fallback to querySelector if the reference is not available
      const tablesList = document.querySelector(".tables-list") as HTMLElement;
      if (tablesList) {
        // Ensure the element is focusable
        if (tablesList.getAttribute("tabindex") === null) {
          tablesList.setAttribute("tabindex", "0");
        }

        // Set selected table if none is selected
        if (!selectedTable() && tables().length > 0) {
          setSelectedTable(tables()[0]);
        }

        // Focus the element
        tablesList.focus();
        setActiveElement("tables-list");

        // Trigger an update of the focused index in TablesList via custom event
        if (typeof globalThis !== "undefined") {
          const updateEvent = new CustomEvent("update-focused-table", {
            detail: { selectedTable: selectedTable() },
          });
          globalThis.dispatchEvent(updateEvent);
        }

        return true;
      }

      return false;
    };

    // Try to focus immediately
    if (attemptFocus()) return;

    // If we couldn't focus immediately and the tables list should be visible,
    // retry a few times with increasing delays
    if (tablesVisible()) {
      const retryInterval = setInterval(() => {
        attempts++;
        if (attemptFocus() || attempts >= maxAttempts) {
          clearInterval(retryInterval);
        }
      }, 50); // Try every 50ms
    }
  }

  // Get app settings database path
  async function getAppSettingsDbPath() {
    // For simplicity, we'll use a fixed path in the app's data directory
    return "schema_settings.db";
  }

  // Initialize application database
  async function initAppDb() {
    try {
      console.log("Initializing app database...");
      
      // Connect to SQLite database for app settings
      const client = createDatabaseClient({
        type: "sqlite",
        path: "settings.db",
      });
      
      // Make sure to connect before executing queries
      await client.connect();
      console.log("Connected to settings database");
      
      setAppDb(client);
      
      // Create settings table if it doesn't exist
      await client.executeQuery(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT
        )
      `);
      
      // Create connections table if it doesn't exist
      await client.executeQuery(`
        CREATE TABLE IF NOT EXISTS connections (
          display_name TEXT,
          meta TEXT,
          type TEXT,
          last_used INTEGER,
          color TEXT,
          PRIMARY KEY (type, meta)
        )
      `);
      
      // Create recent_connections table to track actual usage
      await client.executeQuery(`
        CREATE TABLE IF NOT EXISTS recent_connections (
          display_name TEXT,
          meta TEXT,
          type TEXT,
          last_used INTEGER,
          color TEXT,
          PRIMARY KEY (type, meta)
        )
      `);
      
      // Load settings and connections
      await loadSettings();
      await loadRecentConnections();
      
      console.log("App database initialization complete");
    } catch (err) {
      console.error("Error initializing app database:", err);
      setError(`Error initializing app database: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Track connection as recently used
  async function trackRecentConnection(connection: ConnectionHistory) {
    const db = appDb();
    if (!db) return;

    try {
      // Get the display name and meta info
      const displayName = connection.type === "sqlite"
        ? connection.name.split("/").pop() || connection.name
        : new URL(connection.name).hostname;
        
      // Update or insert into recent_connections table
      await db.executeQuery(
        `INSERT INTO recent_connections (display_name, meta, type, last_used, color)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(type, meta) 
         DO UPDATE SET 
         last_used = excluded.last_used,
         display_name = excluded.display_name,
         color = excluded.color`,
        [
          displayName,
          connection.meta,
          connection.type,
          Math.floor(new Date().getTime()),
          connection.color || null,
        ],
      );
      
      // Limit the number of recent connections to 10
      await db.executeQuery(`
        DELETE FROM recent_connections 
        WHERE rowid NOT IN (
          SELECT rowid FROM recent_connections
          ORDER BY last_used DESC
          LIMIT 10
        )
      `);
      
      // Reload connections
      await loadRecentConnections();
    } catch (err) {
      console.error("Error tracking recent connection:", err);
    }
  }

  // Load recent connections from app database
  async function loadRecentConnections() {
    const db = appDb();
    if (!db) return;

    try {
      console.log("Attempting to load connections...");

      // Load saved connections
      const savedResult = await db.executeQuery(`
        SELECT display_name, meta, type, last_used, color 
        FROM connections
        ORDER BY last_used DESC
        LIMIT 10
      `);

      console.log(`Found ${savedResult.rows.length} saved connections in the database`);

      // Map the results to ConnectionHistory objects
      const savedConns: ConnectionHistory[] = savedResult.rows.map((row) => {
        const displayName = row[0] as string;
        const metaStr = row[1] as string;
        const type = row[2] as "sqlite" | "libsql";
        const lastAccessed = Number(row[3]);
        const color = row[4] as string | undefined;

        try {
          const meta = JSON.parse(metaStr);

          return {
            name: type === "sqlite" ? meta.path : meta.url,
            type,
            meta: metaStr,
            lastAccessed,
            saved: true,
            color
          };
        } catch (e) {
          console.error("Error parsing connection meta:", e);
          return {
            name: displayName,
            type,
            meta: metaStr,
            lastAccessed,
            saved: true,
            color
          };
        }
      });

      setSavedConnections(savedConns);
      
      // Load actual recent connections from the recent_connections table
      const recentResult = await db.executeQuery(`
        SELECT display_name, meta, type, last_used, color 
        FROM recent_connections
        ORDER BY last_used DESC
        LIMIT 5
      `);
      
      console.log(`Found ${recentResult.rows.length} recent connections in the database`);
      
      // Map the results to ConnectionHistory objects
      const recentConns: ConnectionHistory[] = recentResult.rows.map((row) => {
        const displayName = row[0] as string;
        const metaStr = row[1] as string;
        const type = row[2] as "sqlite" | "libsql";
        const lastAccessed = Number(row[3]);
        const color = row[4] as string | undefined;

        try {
          const meta = JSON.parse(metaStr);

          return {
            name: type === "sqlite" ? meta.path : meta.url,
            type,
            meta: metaStr,
            lastAccessed,
            saved: false,
            color
          };
        } catch (e) {
          console.error("Error parsing connection meta:", e);
          return {
            name: displayName,
            type,
            meta: metaStr,
            lastAccessed,
            saved: false,
            color
          };
        }
      });
      
      // If we don't have any recent connections yet, use the most recently accessed saved connections
      if (recentConns.length === 0 && savedConns.length > 0) {
        const tempRecentConns = [...savedConns]
          .sort((a, b) => b.lastAccessed - a.lastAccessed)
          .slice(0, 5);
        
        setRecentConnections(tempRecentConns);
      } else {
        setRecentConnections(recentConns);
      }
    } catch (err) {
      console.error("Error loading connections:", err);
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
        if (key === "theme") {
          loadedSettings[key] = value as "light" | "dark" | "tokyo";
        } else {
          loadedSettings[key] = value;
        }
      }

      setSettings((current) => ({ ...current, ...loadedSettings }));
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
        `UPDATE settings SET value = '${value}' WHERE key = '${key}'`,
      );

      setSettings((current) => ({ ...current, [key]: value }));
    } catch (err) {
      console.error("Error saving setting:", err);
    }
  }

  // Toggle settings menu
  function toggleSettings() {
    setShowSettings(!showSettings());
  }

  // Connect to database with options
  async function connectToDatabase(options?: { saveOnly?: boolean; color?: string }) {
    const saveOnly = options?.saveOnly || false;
    const color = options?.color || "";
    
    // Reset error state
    setError(null);
    
    if (!saveOnly) {
      setLoading(true);
    }
    
    try {
      // Validate connection parameters
      if (connectionType() === "sqlite") {
        if (!dbPath()) {
          throw new Error("SQLite database path is required");
        }
      } else {
        if (!libsqlUrl()) {
          throw new Error("LibSQL URL is required");
        }
      }
      
      const config: DatabaseConfig = {
        type: connectionType(),
        color: color,
      };
      
      if (connectionType() === "sqlite") {
        config.path = dbPath();
      } else {
        config.url = libsqlUrl();
        config.authToken = authToken();
      }
      
      // Create connection meta
      const meta = JSON.stringify(
        connectionType() === "sqlite"
          ? { path: dbPath() }
          : { url: libsqlUrl(), authToken: authToken() }
      );
      
      // Save display name for the connection
      const displayName =
        connectionType() === "sqlite"
          ? dbPath().split("/").pop() || dbPath()
          : new URL(libsqlUrl()).hostname;
      
      // If we're just saving, we just need to insert into the database and reload connections
      if (saveOnly) {
        const db = appDb();
        if (!db) {
          throw new Error("App database not initialized");
        }
        
        if (isEditing()) {
          // Update existing connection
          const currentMeta = 
            connectionType() === "sqlite" 
              ? JSON.stringify({ path: dbPath() }) 
              : JSON.stringify({ url: libsqlUrl(), authToken: authToken() });
            
          await db.executeQuery(
            `UPDATE connections 
             SET display_name = ?, meta = ?, type = ?, last_used = ?, color = ?
             WHERE type = ? AND meta = ?`,
            [
              displayName,
              meta,
              connectionType(),
              Math.floor(new Date().getTime()),
              color,
              connectionType(),
              currentMeta
            ]
          );
        } else {
          // Insert new connection
          await db.executeQuery(
            `INSERT INTO connections (display_name, meta, type, last_used, color)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(type, meta) 
             DO UPDATE SET 
             last_used = excluded.last_used,
             display_name = excluded.display_name,
             color = excluded.color`,
            [
              displayName,
              meta,
              connectionType(),
              Math.floor(new Date().getTime()),
              color,
            ]
          );
        }
        
        // Also track as recent
        trackRecentConnection({
          name: connectionType() === "sqlite" ? dbPath() : libsqlUrl(),
          type: connectionType(),
          meta,
          lastAccessed: Math.floor(new Date().getTime()),
          saved: true,
          color
        });
        
        // Reload the connections
        loadRecentConnections();
        
        // Reset editing mode
        setIsEditing(false);
            
        return;
      }

      // Create and connect to the database
      const client = createDatabaseClient({
        type: connectionType(),
        ...(connectionType() === "sqlite"
          ? { path: dbPath() }
          : { url: libsqlUrl(), authToken: authToken() }),
      });

      await client.connect();
      setDbClient(client);

      // Get table names
      const tableNames = await client.getTables();
      console.log(
        `Found ${tableNames.length} tables: ${tableNames.join(", ")}`,
      );
      setTables(tableNames);

      if (tableNames.length > 0) {
        setSelectedTable(tableNames[0]);
      }

      setConnected(true);
      setShowConnectionDialog(false);

      // Focus on the table list after successful connection
      setTimeout(() => {
        focusTablesList();
      }, 100); // Small delay to ensure UI has updated
    } catch (err) {
      console.error("Error connecting to database:", err);

      // Display a more user-friendly error message
      let errorMessage = err instanceof Error ? err.message : String(err);

      // Add help text for common errors
      if (connectionType() === "libsql" && errorMessage.includes("Auth")) {
        errorMessage +=
          "\n\nFor Turso databases, you can generate an auth token in the Turso dashboard or CLI.";
      }

      setError(errorMessage);
      setConnected(false);
      setTables([]);
    } finally {
      setLoading(false);
    }
  }

  // Handle recent connection selection
  async function handleRecentConnectionSelect(connection: ConnectionHistory) {
    setConnectionType(connection.type);
    if (connection.type === "sqlite") {
      const meta = JSON.parse(connection.meta);
      setDbPath(meta.path);
    } else {
      const meta = JSON.parse(connection.meta);
      setLibsqlUrl(meta.url);
      setAuthToken(meta.authToken || "");
    }
    
    // Update the lastAccessed timestamp in the connections table if it's a saved connection
    const db = appDb();
    if (db && connection.saved) {
      try {
        await db.executeQuery(
          `UPDATE connections 
           SET last_used = ? 
           WHERE type = ? AND meta = ?`,
          [Math.floor(new Date().getTime()), connection.type, connection.meta]
        );
      } catch (err) {
        console.error("Error updating connection timestamp:", err);
      }
    }
    
    // Always track this as a recent connection
    await trackRecentConnection(connection);
    
    // Connect to the database
    connectToDatabase();
  }

  // Handle connection removal
  async function handleRemoveConnection(connection: ConnectionHistory) {
    const db = appDb();
    if (!db) return;

    try {
      // Delete the connection from database
      await db.executeQuery(
        `DELETE FROM connections 
         WHERE type = ? AND meta = ?`,
        [connection.type, connection.meta]
      );

      // Reload connections
      await loadRecentConnections();
    } catch (err) {
      console.error("Error removing connection:", err);
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Handle connection edit
  async function handleEditConnection(connection: ConnectionHistory) {
    // Parse the meta to pre-fill the form
    setConnectionType(connection.type);
    if (connection.type === "sqlite") {
      const meta = JSON.parse(connection.meta);
      setDbPath(meta.path);
    } else {
      const meta = JSON.parse(connection.meta);
      setLibsqlUrl(meta.url);
      setAuthToken(meta.authToken || "");
    }
    
    // Set editing mode
    setIsEditing(true);
    
    // Open the connection dialog with the form visible
    setShowConnectionDialog(true);
    
    // Wait for the dialog to be rendered before showing the form
    setTimeout(() => {
      if (typeof window !== "undefined") {
        (window as any).showConnectionForm?.(true);
      }
    }, 100);
  }

  // Execute SQL query
  async function executeQuery(query: string) {
    const client = dbClient();
    if (!client) return;

    setLoading(true);
    setError("");
    try {
      console.log(
        `Executing query: ${query.substring(0, 100)}${
          query.length > 100 ? "..." : ""
        }`,
      );

      const result = await client.executeQuery(query);
      console.log(
        `Query returned ${result.rows.length} rows with ${result.columns.length} columns`,
      );

      setQueryResults(result);

      // Store current sidebar state
      const wasSidebarOpen = detailSidebarOpen();

      // Auto-select the first row if results exist
      if (result.rows.length > 0) {
        const rowObj = result.rows[0].reduce<Record<string, unknown>>(
          (obj, value, i) => {
            const columnName = result.columns[i] || `column${i}`;
            obj[columnName] = value;
            return obj;
          },
          {},
        );

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
  function handleTableSelect(
    table: string,
    triggerQueryExecution: boolean = true,
  ) {
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
    const newVisibility = !tablesVisible();
    setTablesVisible(newVisibility);

    // If we're making the tables list visible, focus it after rendering
    if (newVisibility) {
      setTimeout(() => {
        const listElement = document.querySelector(".tables-list");
        if (listElement) {
          (listElement as HTMLElement).focus();
          setActiveElement("tables-list");

          // Also manually trigger a focus update to highlight the selected item
          if (typeof globalThis !== "undefined") {
            const updateEvent = new CustomEvent("update-focused-table", {
              detail: { selectedTable: selectedTable() },
            });
            globalThis.dispatchEvent(updateEvent);
          }
        }
      }, 150);
    }
  }

  // Toggle connection dialog
  function toggleConnectionDialog() {
    if (showConnectionDialog()) {
      // Reset editing state when closing the dialog
      setIsEditing(false);
    }
    setShowConnectionDialog(!showConnectionDialog());
  }

  // Toggle help dialog
  function toggleHelpDialog() {
    setShowHelpDialog(!showHelpDialog());
  }

  // Get scrollbar style class based on theme
  const getScrollbarClass = () => {
    if (settings().theme === "tokyo") {
      return "tokyo-scrollbar";
    }
    return "";
  };

  // Disconnect from current database and show home screen
  function disconnectAndShowHome() {
    // Close any dialogs that might be open
    setShowSettings(false);
    setShowConnectionDialog(false);
    setShowHelpDialog(false);
    setDetailSidebarOpen(false);

    // Reset database-related state
    setDbClient(null);
    setTables([]);
    setSelectedTable("");
    setQueryResults(null);
    setError("");
    setConnected(false);
    
    // Reset selection state
    setSelectedRow(null);
    setSelectedRowIndex(null);
  }

  return (
    <div
      class={`flex flex-col h-screen ${
        themeColors[settings().theme].background
      } ${themeColors[settings().theme].text} ${getScrollbarClass()}`}
      style={{
        "font-family": settings().fontFamily,
        "font-size": `${settings().fontSize}px`,
      }}
    >
      {/* Show error message if any */}
      <Show when={error()}>
        <div class={`p-2 bg-red-600 text-white`}>
          {error()}
        </div>
      </Show>

      {/* Main content area - adjust height to account for connection bar */}
      <div class={`flex-1 flex overflow-hidden ${connected() ? 'mb-10' : ''} relative z-10`}>
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
          onHome={disconnectAndShowHome}
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
        <Show
          when={connected()}
          fallback={
            <div class="flex-1 flex items-center justify-center p-4">
              <div
                class={`text-center p-6 w-full max-w-2xl ${
                  themeColors[settings().theme].background
                } ${themeColors[settings().theme].text} border ${
                  themeColors[settings().theme].border
                } rounded-lg shadow-lg`}
              >
                <h2 class="text-2xl font-bold mb-4">
                  Welcome to Schema
                </h2>
                <p class={`${themeColors[settings().theme].subText} mb-6`}>
                  Supports SQLite and LibSQL databases
                </p>
                
                <button
                  type="button"
                  class={`px-4 py-2 ${themeColors[settings().theme].primaryButtonBg} text-white rounded-md hover:opacity-90 transition-opacity flex items-center justify-center mx-auto`}
                  onClick={toggleConnectionDialog}
                >
                  <svg
                    class="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    ></path>
                  </svg>
                  Connect to Database
                </button>

                {/* Recent connections */}
                <Show when={recentConnections().length > 0}>
                  <div class="mt-8">
                    <h3 class="text-lg font-medium mb-4">Recent Connections</h3>
                    <RecentConnections
                      connections={recentConnections()}
                      onSelect={handleRecentConnectionSelect}
                      onRemove={handleRemoveConnection}
                      onEdit={handleEditConnection}
                      theme={settings().theme}
                      showKeyboardShortcuts={true}
                    />
                  </div>
                </Show>
              </div>
            </div>
          }
        >
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
        isEditing={isEditing()}
        theme={settings().theme}
        savedConnections={savedConnections()}
        recentConnections={recentConnections()}
        onSelectRecent={handleRecentConnectionSelect}
        onRemoveConnection={handleRemoveConnection}
        onEditConnection={handleEditConnection}
        isOpen={showConnectionDialog()}
        onClose={() => {
          setShowConnectionDialog(false);
          setIsEditing(false);
        }}
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

      {/* Active Connection Indicator (background bar) */}
      <Show when={connected()}>
        <div class="fixed bottom-0 left-0 right-0 z-0">
          <ActiveConnectionIndicator 
            connectionName={
              connectionType() === "sqlite" 
                ? dbPath() 
                : libsqlUrl()
            }
            connectionType={connectionType()}
            theme={settings().theme}
            onClick={toggleConnectionDialog}
            color={
              dbClient()?.config?.color || 
              (connectionType() === "sqlite" ? "#0d9488" : "#3b82f6")
            }
          />
        </div>
      </Show>
    </div>
  );
}

export default App;
