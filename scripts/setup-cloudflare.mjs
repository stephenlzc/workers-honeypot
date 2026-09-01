#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const DB_NAME = 'openclaw-honeypot';
const CONFIG = 'wrangler.toml';

function assertDatabaseId(value) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''))) {
    throw new Error('Cloudflare returned an invalid D1 database ID.');
  }
  return value;
}

function run(args, options = {}) {
  return execFileSync('npx', ['wrangler', ...args], { encoding: 'utf8', stdio: ['inherit', 'pipe', 'inherit'], ...options });
}

function databaseIdFrom(value) {
  const text = String(value || '');
  const match = text.match(/[0-9a-f]{8}-[0-9a-f-]{27,}/i);
  return match?.[0] || '';
}

console.log('Checking Wrangler authentication…');
try { run(['whoami']); } catch (_) {
  console.error('Wrangler is not authenticated. Run `npx wrangler login` and retry.');
  process.exit(1);
}

let databaseId = '';
try {
  const listed = run(['d1', 'list', '--json']);
    const databases = JSON.parse(listed);
    const rows = Array.isArray(databases) ? databases : (databases.result || databases.databases || []);
    const existing = rows.find(db => db.name === DB_NAME || db.database_name === DB_NAME);
    databaseId = existing?.uuid || existing?.id || '';
} catch (_) {
  // Older Wrangler versions may not support JSON output; creation below remains the fallback.
}

if (!databaseId) {
  console.log(`Creating D1 database: ${DB_NAME}`);
  try {
    databaseId = databaseIdFrom(run(['d1', 'create', DB_NAME, '--json']));
  } catch (_) {
    databaseId = databaseIdFrom(run(['d1', 'create', DB_NAME]));
  }
}
if (!databaseId) {
  console.error('Could not determine the D1 database ID. Create it manually and place the ID in wrangler.toml.');
  process.exit(1);
}
try { databaseId = assertDatabaseId(databaseId); } catch (error) {
  console.error(error.message);
  process.exit(1);
}

let config = readFileSync(CONFIG, 'utf8');
config = config.replace(/database_id\s*=\s*"[^"]*"/, `database_id = "${databaseId}"`);
writeFileSync(CONFIG, config);
console.log(`Using D1 database ${databaseId}.`);

console.log('Applying schema to the remote D1 database…');
run(['d1', 'execute', DB_NAME, '--remote', '--file=schema.sql'], { stdio: 'inherit' });

console.log('Configure the Admin password. It is sent directly to Wrangler and never written to disk.');
const secret = spawnSync('npx', ['wrangler', 'secret', 'put', 'ADMIN_PASSWORD'], { stdio: 'inherit' });
if (secret.status !== 0) process.exit(secret.status || 1);

console.log('Deploying the Worker…');
run(['deploy'], { stdio: 'inherit' });
console.log('\nSetup complete. Open /admin on the deployed workers.dev URL and sign in with your configured password.');
