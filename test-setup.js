#!/usr/bin/env node

/**
 * Test setup script for MySQL MCP server
 * 
 * This script:
 * 1. Creates a test database and table
 * 2. Inserts sample data
 * 3. Tests each MCP tool against the database
 * 
 * Usage:
 *   node test-setup.js
 * 
 * Environment variables:
 *   MYSQL_HOST - MySQL host (default: localhost)
 *   MYSQL_PORT - MySQL port (default: 3306)
 *   MYSQL_USER - MySQL username
 *   MYSQL_PASSWORD - MySQL password
 */

import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Configuration from environment variables
const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
};

// Test database and table names
const TEST_DB = 'mcp_test_db';
const TEST_TABLE = 'users';

// Check required environment variables
if (!config.user) {
  console.error('Error: MYSQL_USER environment variable is required');
  console.error('Example usage:');
  console.error('  MYSQL_USER=root MYSQL_PASSWORD=password node test-setup.js');
  process.exit(1);
}

// Create a connection pool
const pool = mysql.createPool({
  ...config,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Main function
 */
async function main() {
  console.log('MySQL MCP Server Test Setup');
  console.log('===========================');
  console.log(`Host: ${config.host}:${config.port}`);
  console.log(`User: ${config.user}`);
  console.log();

  try {
    // Test connection
    console.log('Testing connection...');
    await testConnection();
    console.log('✅ Connection successful');
    console.log();

    // Create test database
    console.log(`Creating test database '${TEST_DB}'...`);
    await createTestDatabase();
    console.log(`✅ Database '${TEST_DB}' created`);
    console.log();

    // Create test table
    console.log(`Creating test table '${TEST_TABLE}'...`);
    await createTestTable();
    console.log(`✅ Table '${TEST_TABLE}' created`);
    console.log();

    // Insert sample data
    console.log('Inserting sample data...');
    await insertSampleData();
    console.log('✅ Sample data inserted');
    console.log();

    // Test queries
    console.log('Testing queries...');
    await testQueries();
    console.log('✅ All queries executed successfully');
    console.log();

    console.log('Test setup completed successfully!');
    console.log();
    console.log('You can now use the following MCP tools:');
    console.log('1. list_databases - Should show the test database');
    console.log('2. list_tables - With database="mcp_test_db"');
    console.log('3. describe_table - With database="mcp_test_db", table="users"');
    console.log('4. execute_query - With database="mcp_test_db", query="SELECT * FROM users"');
    console.log();
    console.log('MCP Settings Configuration:');
    console.log(JSON.stringify({
      mcpServers: {
        mysql: {
          command: 'node',
          args: ['/path/to/mysql-mcp-server/build/index.js'],
          env: {
            MYSQL_HOST: config.host,
            MYSQL_PORT: String(config.port),
            MYSQL_USER: config.user,
            MYSQL_PASSWORD: config.password,
            MYSQL_DATABASE: TEST_DB,
          },
          disabled: false,
          autoApprove: [],
        },
      },
    }, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

/**
 * Test the database connection
 */
async function testConnection() {
  const connection = await pool.getConnection();
  connection.release();
}

/**
 * Create the test database
 */
async function createTestDatabase() {
  await pool.query(`DROP DATABASE IF EXISTS ${TEST_DB}`);
  await pool.query(`CREATE DATABASE ${TEST_DB}`);
}

/**
 * Create the test table
 */
async function createTestTable() {
  await pool.query(`USE ${TEST_DB}`);
  await pool.query(`
    CREATE TABLE ${TEST_TABLE} (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL,
      age INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/**
 * Insert sample data
 */
async function insertSampleData() {
  await pool.query(`USE ${TEST_DB}`);
  
  const users = [
    { name: 'John Doe', email: 'john@example.com', age: 30 },
    { name: 'Jane Smith', email: 'jane@example.com', age: 25 },
    { name: 'Bob Johnson', email: 'bob@example.com', age: 40 },
    { name: 'Alice Brown', email: 'alice@example.com', age: 35 },
    { name: 'Charlie Davis', email: 'charlie@example.com', age: 28 },
  ];
  
  for (const user of users) {
    await pool.query(
      `INSERT INTO ${TEST_TABLE} (name, email, age) VALUES (?, ?, ?)`,
      [user.name, user.email, user.age]
    );
  }
}

/**
 * Test various queries
 */
async function testQueries() {
  await pool.query(`USE ${TEST_DB}`);
  
  // Test SELECT
  const [rows] = await pool.query(`SELECT * FROM ${TEST_TABLE}`);
  console.log(`  - SELECT: Found ${rows.length} rows`);
  
  // Test SHOW TABLES
  const [tables] = await pool.query('SHOW TABLES');
  console.log(`  - SHOW TABLES: Found ${tables.length} tables`);
  
  // Test DESCRIBE
  const [columns] = await pool.query(`DESCRIBE ${TEST_TABLE}`);
  console.log(`  - DESCRIBE: Found ${columns.length} columns`);
}

// Run the main function
main().catch(console.error);
