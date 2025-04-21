/**
 * MySQL connection management for MCP server
 */

import mysql from 'mysql2/promise';
import { MySQLConfig } from './types.js';

// Default connection pool configuration
const DEFAULT_PORT = 3306;           // Default MySQL port
const DEFAULT_TIMEOUT = 10000;       // Default connection timeout in milliseconds
const DEFAULT_CONNECTION_LIMIT = 10; // Default maximum number of connections in the pool
const DEFAULT_QUEUE_LIMIT = 0;       // Default maximum number of connection requests to queue (0 = unlimited)
const DEFAULT_ROW_LIMIT = 1000;      // Default row limit for query results

/**
 * Create a MySQL connection pool
 */
export function createConnectionPool(config: MySQLConfig): mysql.Pool {
  console.error('[Setup] Creating MySQL connection pool');
  
  try {
    // Create connection options with defaults
    const poolConfig: mysql.PoolOptions = {
      host: config.host,
      port: config.port,
      user: config.user,
      waitForConnections: true,
      connectionLimit: config.connectionLimit ?? DEFAULT_CONNECTION_LIMIT,
      queueLimit: config.queueLimit ?? DEFAULT_QUEUE_LIMIT,
      connectTimeout: config.connectTimeout ?? DEFAULT_TIMEOUT,
    };
    
    // Add password if provided
    if (config.password !== undefined) {
      poolConfig.password = config.password;
    }
    
    // Add database if provided
    if (config.database) {
      poolConfig.database = config.database;
    }
    
    // Add idleTimeout if provided
    if (config.idleTimeout !== undefined) {
      poolConfig.idleTimeout = config.idleTimeout;
    }
    
    // Add maxIdle if provided
    if (config.maxIdle !== undefined) {
      poolConfig.maxIdle = config.maxIdle;
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
  
  // Connection pool options
  const connectionLimitStr = process.env.MYSQL_CONNECTION_LIMIT;
  const queueLimitStr = process.env.MYSQL_QUEUE_LIMIT;
  const connectTimeoutStr = process.env.MYSQL_CONNECT_TIMEOUT;
  const idleTimeoutStr = process.env.MYSQL_IDLE_TIMEOUT;
  const maxIdleStr = process.env.MYSQL_MAX_IDLE;
  
  if (!host) throw new Error('MYSQL_HOST environment variable is required');
  if (!user) throw new Error('MYSQL_USER environment variable is required');
  
  const port = portStr ? parseInt(portStr, 10) : DEFAULT_PORT;
  
  // Parse connection pool options (all optional)
  const connectionLimit = connectionLimitStr ? parseInt(connectionLimitStr, 10) : undefined;
  const queueLimit = queueLimitStr ? parseInt(queueLimitStr, 10) : undefined;
  const connectTimeout = connectTimeoutStr ? parseInt(connectTimeoutStr, 10) : undefined;
  const idleTimeout = idleTimeoutStr ? parseInt(idleTimeoutStr, 10) : undefined;
  const maxIdle = maxIdleStr ? parseInt(maxIdleStr, 10) : undefined;
  
  return { 
    host, 
    port, 
    user, 
    password, 
    database,
    connectionLimit,
    queueLimit,
    connectTimeout,
    idleTimeout,
    maxIdle
  };
}
