/**
 * SQL query validators for MySQL MCP server
 * Ensures that only read-only queries are allowed
 */

// List of allowed SQL commands (read-only operations)
const ALLOWED_COMMANDS = [
  'SELECT',
  'SHOW',
  'DESCRIBE',
  'DESC',
  'EXPLAIN',
];

// List of disallowed SQL commands (write operations)
const DISALLOWED_COMMANDS = [
  'INSERT',
  'UPDATE',
  'DELETE',
  'DROP',
  'CREATE',
  'ALTER',
  'TRUNCATE',
  'RENAME',
  'REPLACE',
  'GRANT',
  'REVOKE',
  'LOCK',
  'UNLOCK',
  'CALL',
  'EXEC',
  'EXECUTE',
  'SET',
  'START',
  'BEGIN',
  'COMMIT',
  'ROLLBACK',
  'OUTFILE',
  'DUMPFILE',
  'LOAD_FILE'
];

/**
 * Validates if a SQL query is read-only
 * @param query SQL query to validate
 * @returns true if the query is read-only, false otherwise
 */
export function isReadOnlyQuery(query: string): boolean {
  // Normalize query by removing comments and extra whitespace
  const normalizedQuery = query
    .replace(/--.*$/gm, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .toUpperCase();
  
  // Check if query starts with an allowed command
  const startsWithAllowed = ALLOWED_COMMANDS.some(cmd => 
    normalizedQuery.startsWith(cmd + ' ') || normalizedQuery === cmd
  );
  
  // Check if query contains any disallowed commands
  const containsDisallowed = DISALLOWED_COMMANDS.some(cmd => {
    const regex = new RegExp(`(^|\\s)${cmd}(\\s|$)`);
    return regex.test(normalizedQuery);
  });
  
  // Check for multiple statements (;)
  const hasMultipleStatements = normalizedQuery.includes(';') && 
    !normalizedQuery.endsWith(';');
  
  // Query is read-only if it starts with an allowed command,
  // doesn't contain any disallowed commands, and doesn't have multiple statements
  return startsWithAllowed && !containsDisallowed && !hasMultipleStatements;
}

/**
 * Validates if a SQL query is safe to execute
 * @param query SQL query to validate
 * @throws Error if the query is not safe
 */
export function validateQuery(query: string): void {
  console.error('[Validator] Validating query:', query);
  
  if (!query || typeof query !== 'string') {
    throw new Error('Query must be a non-empty string');
  }
  
  if (!isReadOnlyQuery(query)) {
    console.error('[Validator] Query rejected: not read-only');
    throw new Error('Only read-only queries are allowed (SELECT, SHOW, DESCRIBE, EXPLAIN)');
  }
  
  console.error('[Validator] Query validated as read-only');
}
