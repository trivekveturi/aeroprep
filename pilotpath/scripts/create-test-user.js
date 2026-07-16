const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

function loadEnv(envPath) {
  const content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    env[key] = rest.join('=').trim();
  }
  return env;
}

async function main() {
  const env = loadEnv(path.join(process.cwd(), '.env.local'));
  const pool = mysql.createPool({
    host: env.MYSQL_HOST || 'localhost',
    port: Number(env.MYSQL_PORT || 3306),
    user: env.MYSQL_USER || 'root',
    password: env.MYSQL_PASSWORD || '',
    database: env.MYSQL_DATABASE || 'pilot_exam',
  });

  const username = 'pilotpath';
  const displayName = 'Pilot Path Tester';
  const password = 'Password123';

  try {
    const hashed = await bcrypt.hash(password, 12);
    await pool.execute(
      'INSERT INTO users (id, username, display_name, password_hash, created_at) VALUES (UUID(), ?, ?, ?, NOW())',
      [username, displayName, hashed],
    );
    console.log('Created test user:');
    console.log('  username:', username);
    console.log('  password:', password);
  } catch (err) {
    console.error('ERROR:', err.message || err);
  } finally {
    await pool.end();
  }
}

main();
