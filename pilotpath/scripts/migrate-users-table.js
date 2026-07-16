const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

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
  const envFile = path.join(process.cwd(), '.env.local');
  const env = loadEnv(envFile);

  const pool = mysql.createPool({
    host: env.MYSQL_HOST || 'localhost',
    port: Number(env.MYSQL_PORT || 3306),
    user: env.MYSQL_USER || 'root',
    password: env.MYSQL_PASSWORD || '',
    database: env.MYSQL_DATABASE || 'pilot_exam',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  try {
    console.log('Using DB:', env.MYSQL_DATABASE || 'pilot_exam');
    const [rows] = await pool.execute("SHOW TABLES LIKE 'users'");
    const exists = rows.length > 0;
    console.log('users table exists:', exists);
    if (!exists) {
      console.log('Creating users table...');
      await pool.execute(`
        CREATE TABLE users (
          id CHAR(36) NOT NULL PRIMARY KEY,
          username VARCHAR(191) NOT NULL UNIQUE,
          display_name VARCHAR(191) NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at DATETIME NOT NULL,
          INDEX idx_username(username)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('users table created successfully.');
    } else {
      const [cols] = await pool.execute('SHOW COLUMNS FROM users');
      console.log('users table columns:', cols.map(c => c.Field).join(', '));
    }
  } catch (err) {
    console.error('ERROR:', err.message || err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
