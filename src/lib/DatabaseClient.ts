import Database from '@tauri-apps/plugin-sql';
import { createClient } from '@libsql/client';
import type { Client as LibSQLClient } from '@libsql/client';
import { DatabaseConfig, QueryResult, TableInfo } from '../types.ts';

interface SQLiteResult extends Array<Record<string, unknown>> {
  length: number;
}

export class DatabaseClient {
  private sqliteDb: Database | null = null;
  private libsqlDb: LibSQLClient | null = null;
  private config: DatabaseConfig | null = null;

  async connect(config: DatabaseConfig): Promise<void> {
    this.config = config;

    if (config.type === 'sqlite') {
      if (!config.path) {
        throw new Error('SQLite database path is required');
      }
      this.sqliteDb = await Database.load(`sqlite:${config.path}`);
      this.libsqlDb = null;
    } else {
      if (!config.url) {
        throw new Error('LibSQL URL is required');
      }
      this.libsqlDb = createClient({
        url: config.url,
        authToken: config.authToken,
      });
      this.sqliteDb = null;
    }
  }

  async disconnect(): Promise<void> {
    if (this.sqliteDb) {
      await this.sqliteDb.close();
      this.sqliteDb = null;
    }
    if (this.libsqlDb) {
      // LibSQL client doesn't require explicit disconnection
      this.libsqlDb = null;
    }
    this.config = null;
  }

  async executeQuery(sql: string): Promise<QueryResult> {
    try {
      if (this.sqliteDb) {
        const result = await this.sqliteDb.select<SQLiteResult>(sql);
        return {
          columns: result.length > 0 ? Object.keys(result[0]) : [],
          rows: result.map((row: Record<string, unknown>) => Object.values(row)),
          rowCount: result.length,
        };
      } else if (this.libsqlDb) {
        const result = await this.libsqlDb.execute(sql);
        return {
          columns: result.columns ?? [],
          rows: result.rows.map(row => Object.values(row)),
          rowCount: result.rows.length,
        };
      } else {
        throw new Error('No database connection');
      }
    } catch (error) {
      return {
        columns: [],
        rows: [],
        rowCount: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getTables(): Promise<TableInfo[]> {
    const sql = `
      SELECT 
        name,
        sql
      FROM 
        sqlite_master 
      WHERE 
        type='table' 
        AND name NOT LIKE 'sqlite_%'
      ORDER BY 
        name
    `;

    try {
      const tables = await this.executeQuery(sql);
      const tableInfos: TableInfo[] = [];

      for (const row of tables.rows) {
        const tableName = row[0] as string;
        const columnsResult = await this.executeQuery(`PRAGMA table_info(${tableName})`);
        
        tableInfos.push({
          name: tableName,
          columns: columnsResult.rows.map(col => ({
            name: col[1] as string,
            type: col[2] as string,
            notnull: col[3] as number,
            dflt_value: col[4],
            pk: col[5] as number,
          })),
        });
      }

      return tableInfos;
    } catch (error) {
      console.error('Error getting tables:', error);
      return [];
    }
  }

  isConnected(): boolean {
    return this.sqliteDb !== null || this.libsqlDb !== null;
  }

  getConfig(): DatabaseConfig | null {
    return this.config;
  }
} 