# MySQL Database Access MCP Server

This MCP server provides read-only access to MySQL databases. It allows you to:

- List available databases
- List tables in a database
- Describe table schemas
- Execute read-only SQL queries

## Security Features

- **Read-only access**: Only SELECT, SHOW, DESCRIBE, and EXPLAIN statements are allowed
- **Query validation**: Prevents SQL injection and blocks any data modification attempts
- **Query timeout**: Prevents long-running queries from consuming resources
- **Row limit**: Prevents excessive data return

## Installation

### Option 1: Install from NPM (Recommended)

```bash
# Install globally
npm install -g mysql-mcp-server

# Or install locally in your project
npm install mysql-mcp-server
```

### Option 2: Build from Source

```bash
# Clone the repository
git clone https://github.com/dpflucas/mysql-mcp-server.git
cd mysql-mcp-server

# Install dependencies and build
npm install
npm run build
```

### 2. Configure environment variables

The server requires the following environment variables:

- `MYSQL_HOST`: Database server hostname
- `MYSQL_PORT`: Database server port (default: 3306)
- `MYSQL_USER`: Database username
- `MYSQL_PASSWORD`: Database password (optional, but recommended for secure connections)
- `MYSQL_DATABASE`: Default database name (optional)

### 3. Add to MCP settings

Add the following configuration to your MCP settings file:

If you installed via npm (Option 1):
```json
{
  "mcpServers": {
    "mysql": {
      "command": "npx",
      "args": ["mysql-mcp-server"],
      "env": {
        "MYSQL_HOST": "your-mysql-host",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "your-mysql-user",
        "MYSQL_PASSWORD": "your-mysql-password",
        "MYSQL_DATABASE": "your-default-database"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

If you built from source (Option 2):
```json
{
  "mcpServers": {
    "mysql": {
      "command": "node",
      "args": ["/path/to/mysql-mcp-server/build/index.js"],
      "env": {
        "MYSQL_HOST": "your-mysql-host",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "your-mysql-user",
        "MYSQL_PASSWORD": "your-mysql-password",
        "MYSQL_DATABASE": "your-default-database"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## Available Tools

### list_databases

Lists all accessible databases on the MySQL server.

**Parameters**: None

**Example**:
```json
{
  "server_name": "mysql",
  "tool_name": "list_databases",
  "arguments": {}
}
```

### list_tables

Lists all tables in a specified database.

**Parameters**:
- `database` (optional): Database name (uses default if not specified)

**Example**:
```json
{
  "server_name": "mysql",
  "tool_name": "list_tables",
  "arguments": {
    "database": "my_database"
  }
}
```

### describe_table

Shows the schema for a specific table.

**Parameters**:
- `database` (optional): Database name (uses default if not specified)
- `table` (required): Table name

**Example**:
```json
{
  "server_name": "mysql",
  "tool_name": "describe_table",
  "arguments": {
    "database": "my_database",
    "table": "my_table"
  }
}
```

### execute_query

Executes a read-only SQL query.

**Parameters**:
- `query` (required): SQL query (only SELECT, SHOW, DESCRIBE, and EXPLAIN statements are allowed)
- `database` (optional): Database name (uses default if not specified)

**Example**:
```json
{
  "server_name": "mysql",
  "tool_name": "execute_query",
  "arguments": {
    "database": "my_database",
    "query": "SELECT * FROM my_table LIMIT 10"
  }
}
```

## Testing

The server includes test scripts to verify functionality with your MySQL setup:

### 1. Setup Test Database

This script creates a test database, table, and sample data:

```bash
# Set your MySQL credentials as environment variables
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_USER=your_username
export MYSQL_PASSWORD=your_password

# Run the setup script
npm run test:setup
```

### 2. Test MCP Tools

This script tests each of the MCP tools against the test database:

```bash
# Set your MySQL credentials as environment variables
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_USER=your_username
export MYSQL_PASSWORD=your_password
export MYSQL_DATABASE=mcp_test_db

# Run the tools test script
npm run test:tools
```

### 3. Run All Tests

To run both setup and tool tests:

```bash
# Set your MySQL credentials as environment variables
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_USER=your_username
export MYSQL_PASSWORD=your_password

# Run all tests
npm test
```

## Troubleshooting

If you encounter issues:

1. Check the server logs for error messages
2. Verify your MySQL credentials and connection details
3. Ensure your MySQL user has appropriate permissions
4. Check that your query is read-only and properly formatted

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
