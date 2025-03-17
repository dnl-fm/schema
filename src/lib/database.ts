import Database from "@tauri-apps/plugin-sql";
import { createClient } from "@libsql/client";
import type { QueryResult } from "../types.ts";
import type { InValue } from "@libsql/client";

export type DatabaseType = 'sqlite' | 'libsql';

export interface DatabaseConfig {
  type: DatabaseType;
  path?: string;  // For SQLite
  url?: string;   // For LibSQL
  authToken?: string; // For LibSQL
}

export interface DatabaseClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getTables(): Promise<string[]>;
  executeQuery(query: string, params?: (string | number | boolean | null)[]): Promise<QueryResult>;
  config: DatabaseConfig;
}

class SQLiteClient implements DatabaseClient {
  private db: Database | null = null;
  private path: string;
  config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    if (!config.path) throw new Error("SQLite requires a path");
    this.path = config.path;
    this.config = { ...config };
  }

  async connect(): Promise<void> {
    try {
      this.db = await Database.load(`sqlite:${this.path}`);
      
      // Test the connection by executing a simple query
      await this.db.select("SELECT 1");
    } catch (error) {
      // Format a helpful error message
      let errorMessage = "Failed to connect to SQLite database";
      
      if (error instanceof Error) {
        if (error.message.includes("no such file")) {
          errorMessage = "Database file not found. Please check the file path.";
        } else if (error.message.includes("permission")) {
          errorMessage = "Permission denied. Cannot access the database file.";
        } else if (error.message.includes("corrupt") || error.message.includes("malformed")) {
          errorMessage = "Database file is corrupt or not a valid SQLite database.";
        } else {
          errorMessage = `SQLite connection error: ${error.message}`;
        }
      }
      
      throw new Error(errorMessage);
    }
  }

  async disconnect(): Promise<void> {
    // SQLite connections are managed by Tauri
  }

  async getTables(): Promise<string[]> {
    if (!this.db) throw new Error("Not connected");
    const result = await this.db.select<Array<{ name: string }>>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
    );
    return result.map(row => row.name);
  }

  async executeQuery(query: string, params?: (string | number | boolean | null)[]): Promise<QueryResult> {
    if (!this.db) throw new Error("Not connected");
    const rows = params 
      ? await this.db.select<Record<string, unknown>[]>(query, params)
      : await this.db.select<Record<string, unknown>[]>(query);
    
    const result = rows.map(row => Object.values(row));
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    
    return {
      columns,
      rows: result,
      rowCount: rows.length
    };
  }
}

class LibSQLClient implements DatabaseClient {
  private client: ReturnType<typeof createClient> | null = null;
  private libConfig: Required<Pick<DatabaseConfig, 'url' | 'authToken'>>;
  config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    if (!config.url) throw new Error("LibSQL requires a URL");
    this.libConfig = { 
      url: config.url, 
      authToken: config.authToken || '' 
    };
    this.config = { ...config };
  }

  async connect(): Promise<void> {
    try {
      this.client = createClient({
        url: this.libConfig.url,
        authToken: this.libConfig.authToken
      });
      
      // Test the connection by executing a simple query
      await this.client.execute("SELECT 1");
    } catch (error) {
      // Format a helpful error message
      let errorMessage = "Failed to connect to LibSQL database";
      
      if (error instanceof Error) {
        if (error.message.includes("401")) {
          errorMessage = "Authentication failed. Please check your auth token.";
        } else if (error.message.includes("404") || error.message.includes("not found")) {
          errorMessage = "Database not found. Please check your LibSQL URL.";
        } else if (error.message.includes("connection") || error.message.includes("network")) {
          errorMessage = "Network error. Please check your internet connection and LibSQL URL.";
        } else {
          errorMessage = `LibSQL connection error: ${error.message}`;
        }
      }
      
      throw new Error(errorMessage);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
  }

  async getTables(): Promise<string[]> {
    if (!this.client) throw new Error("Not connected");
    const result = await this.client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
    );
    return result.rows.map(row => row[0] as string);
  }

  async executeQuery(query: string, params?: (string | number | boolean | null)[]): Promise<QueryResult> {
    if (!this.client) throw new Error("Not connected");
    const result = await (params 
      ? this.client.execute(query, params as InValue[])
      : this.client.execute(query));
    
    return {
      columns: result.columns ?? [],
      rows: result.rows.map(row => Object.values(row)),
      rowCount: result.rows.length
    };
  }
}

export function createDatabaseClient(config: DatabaseConfig): DatabaseClient {
  switch (config.type) {
    case 'sqlite':
      return new SQLiteClient(config);
    case 'libsql':
      return new LibSQLClient(config);
    default:
      throw new Error(`Unsupported database type: ${config.type}`);
  }
} 