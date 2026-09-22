#!/usr/bin/env node

import assert from 'node:assert/strict';
import { isReadOnlyQuery, validateQuery } from './build/validators.js';

const allowedQueries = [
  'SELECT * FROM users',
  'SHOW TABLES',
  'DESCRIBE users',
  'EXPLAIN SELECT * FROM users',
];

for (const query of allowedQueries) {
  assert.equal(isReadOnlyQuery(query), true, `Expected query to be allowed: ${query}`);
  assert.doesNotThrow(() => validateQuery(query), `Expected query to validate: ${query}`);
}

const rejectedQueries = [
  "SELECT * FROM users INTO OUTFILE '/tmp/users.txt'",
  "SELECT * FROM users INTO DUMPFILE '/tmp/users.dump'",
  'SELECT id INTO @user_id FROM users',
  "SELECT LOAD_FILE('/etc/passwd')",
  "SELECT load_file ( '/etc/passwd' )",
  "select * from users in/**/to outfile '/tmp/users.txt'",
  'SELECT * FROM users; DELETE FROM users',
];

for (const query of rejectedQueries) {
  assert.equal(isReadOnlyQuery(query), false, `Expected query to be rejected: ${query}`);
  assert.throws(() => validateQuery(query), `Expected query to fail validation: ${query}`);
}

console.log('Validator tests passed');
