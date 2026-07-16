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
  const env = loadEnv(path.join(process.cwd(), '.env.local'));
  const pool = mysql.createPool({
    host: env.MYSQL_HOST || 'localhost',
    port: Number(env.MYSQL_PORT || 3306),
    user: env.MYSQL_USER || 'root',
    password: env.MYSQL_PASSWORD || '',
    database: env.MYSQL_DATABASE || 'pilot_exam',
  });
  try {
    const [rows] = await pool.execute('SELECT COUNT(*) AS count FROM users');
    console.log('users count:', rows[0].count ?? rows[0]['COUNT(*)']);
  } catch (err) {
    console.error('ERROR:', err.message || err);
  } finally {
    await pool.end();
  }
}

main();
