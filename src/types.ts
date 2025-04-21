/**
 * Type definitions for MySQL MCP server
 */

// MySQL connection configuration
export interface MySQLConfig {
  host: string;
  port: number;
  user: string;
  password?: string;
  database?: string;
  
  // Connection pool options
  connectionLimit?: number;
  queueLimit?: number;
  connectTimeout?: number;
  idleTimeout?: number;
  maxIdle?: number;
}

// Database information
export interface DatabaseInfo {
  name: string;
}

// Table information
export interface TableInfo {
  name: string;
  type: string;
}

// Column information
export interface ColumnInfo {
  Field: string;
  Type: string;
  Null: string;
  Key: string;
  Default: string | null;
  Extra: string;
}

// Query result
export interface QueryResult {
  rows: any[];
  fields: any[];
}
