/**
 * MySQL connection management for MCP server
 */

import mysql from 'mysql2/promise';
import { MySQLConfig } from './types.js';

// Default connection timeout in milliseconds
const DEFAULT_TIMEOUT = 10000;

// Default row limit for query results
const DEFAULT_ROW_LIMIT = 1000;

/**
 * Create a MySQL connection pool
 */
export function createConnectionPool(config: MySQLConfig): mysql.Pool {
  console.error('[Setup] Creating MySQL connection pool');
  
  try {
    // Create connection options
    const poolConfig: mysql.PoolOptions = {
      host: config.host,
      port: config.port,
      user: config.user,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: DEFAULT_TIMEOUT,
    };
    
    // Add password if provided
    if (config.password !== undefined) {
      poolConfig.password = config.password;
    }
    
    // Add database if provided
    if (config.database) {
      poolConfig.database = config.database;
    }
    
    return mysql.createPool(poolConfig);
  } catch (error) {
    console.error('[Error] Failed to create connection pool:', error);
    throw error;
  }
}

/**
 * Execute a query with error handling and logging
 */
export async function executeQuery(
  pool: mysql.Pool,
  sql: string,
  params: any[] = [],
  database?: string
): Promise<{ rows: any; fields: mysql.FieldPacket[] }> {
  console.error(`[Query] Executing: ${sql}`);
  
  let connection: mysql.PoolConnection | null = null;
  
  try {
    // Get connection from pool
    connection = await pool.getConnection();
    
    // Use specific database if provided
    if (database) {
      console.error(`[Query] Using database: ${database}`);
      await connection.query(`USE \`${database}\``);
    }
    
    // Execute query with timeout
    const [rows, fields] = await Promise.race([
      connection.query(sql, params),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), DEFAULT_TIMEOUT);
      }),
    ]);
    
    // Apply row limit if result is an array
    const limitedRows = Array.isArray(rows) && rows.length > DEFAULT_ROW_LIMIT
      ? rows.slice(0, DEFAULT_ROW_LIMIT)
      : rows;
    
    // Log result summary
    console.error(`[Query] Success: ${Array.isArray(rows) ? rows.length : 1} rows returned`);
    
    return { rows: limitedRows, fields };
  } catch (error) {
    console.error('[Error] Query execution failed:', error);
    throw error;
  } finally {
    // Release connection back to pool
    if (connection) {
      connection.release();
    }
  }
}

/**
 * Get MySQL connection configuration from environment variables
 */
export function getConfigFromEnv(): MySQLConfig {
  const host = process.env.MYSQL_HOST;
  const portStr = process.env.MYSQL_PORT;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;
  
  if (!host) throw new Error('MYSQL_HOST environment variable is required');
  if (!user) throw new Error('MYSQL_USER environment variable is required');
  
  const port = portStr ? parseInt(portStr, 10) : 3306;
  
  return { host, port, user, password, database };
}
