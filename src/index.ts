#!/usr/bin/env node

/**
 * MySQL Database Access MCP Server
 * 
 * This MCP server provides read-only access to MySQL databases.
 * It allows:
 * - Listing available databases
 * - Listing tables in a database
 * - Describing table schemas
 * - Executing read-only SQL queries
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import mysql from 'mysql2/promise';

import { createConnectionPool, executeQuery, getConfigFromEnv } from './connection.js';
import { validateQuery } from './validators.js';

// Create MySQL connection pool
let pool: mysql.Pool;

try {
  const config = getConfigFromEnv();
  console.error('[Setup] MySQL configuration:', { 
    host: config.host, 
    port: config.port, 
    user: config.user, 
    password: config.password ? '********' : '(not provided)',
    database: config.database || '(default not set)' 
  });
  pool = createConnectionPool(config);
} catch (error) {
  console.error('[Fatal] Failed to initialize MySQL connection:', error);
  process.exit(1);
}

/**
 * Create an MCP server with tools for MySQL database access
 */
const server = new Server(
  {
    name: "mysql-mcp-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Handler that lists available tools for MySQL database access
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_databases",
        description: "List all accessible databases on the MySQL server",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        }
      },
      {
        name: "list_tables",
        description: "List all tables in a specified database",
        inputSchema: {
          type: "object",
          properties: {
            database: {
              type: "string",
              description: "Database name (optional, uses default if not specified)"
            }
          },
          required: []
        }
      },
      {
        name: "describe_table",
        description: "Show the schema for a specific table",
        inputSchema: {
          type: "object",
          properties: {
            database: {
              type: "string",
              description: "Database name (optional, uses default if not specified)"
            },
            table: {
              type: "string",
              description: "Table name"
            }
          },
          required: ["table"]
        }
      },
      {
        name: "execute_query",
        description: "Execute a read-only SQL query",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "SQL query (only SELECT, SHOW, DESCRIBE, and EXPLAIN statements are allowed)"
            },
            database: {
              type: "string",
              description: "Database name (optional, uses default if not specified)"
            }
          },
          required: ["query"]
        }
      }
    ]
  };
});

/**
 * Handler for MySQL database access tools
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (request.params.name) {
      case "list_databases": {
        console.error('[Tool] Executing list_databases');
        
        const { rows } = await executeQuery(
          pool,
          'SHOW DATABASES'
        );
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(rows, null, 2)
          }]
        };
      }
      
      case "list_tables": {
        console.error('[Tool] Executing list_tables');
        
        const database = request.params.arguments?.database as string | undefined;
        
        const { rows } = await executeQuery(
          pool,
          'SHOW FULL TABLES',
          [],
          database
        );
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(rows, null, 2)
          }]
        };
      }
      
      case "describe_table": {
        console.error('[Tool] Executing describe_table');
        
        const database = request.params.arguments?.database as string | undefined;
        const table = request.params.arguments?.table as string;
        
        if (!table) {
          throw new McpError(ErrorCode.InvalidParams, "Table name is required");
        }
        
        const { rows } = await executeQuery(
          pool,
          `DESCRIBE \`${table}\``,
          [],
          database
        );
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(rows, null, 2)
          }]
        };
      }
      
      case "execute_query": {
        console.error('[Tool] Executing execute_query');
        
        const query = request.params.arguments?.query as string;
        const database = request.params.arguments?.database as string | undefined;
        
        if (!query) {
          throw new McpError(ErrorCode.InvalidParams, "Query is required");
        }
        
        // Validate that the query is read-only
        validateQuery(query);
        
        const { rows } = await executeQuery(
          pool,
          query,
          [],
          database
        );
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(rows, null, 2)
          }]
        };
      }
      
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
    }
  } catch (error) {
    console.error('[Error] Tool execution failed:', error);
    
    // Format error message for client
    return {
      content: [{
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
});

/**
 * Start the server using stdio transport
 */
async function main() {
  console.error('[Setup] Starting MySQL MCP server');
  
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('[Setup] MySQL MCP server running on stdio');
  } catch (error) {
    console.error('[Fatal] Failed to start server:', error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.error('[Shutdown] Closing MySQL connection pool');
  await pool.end();
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error('[Fatal] Unhandled error:', error);
  process.exit(1);
});
