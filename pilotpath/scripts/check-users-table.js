const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'pilot_exam',
  });

  try {
    const [rows] = await pool.execute("SHOW TABLES LIKE 'users'");
    console.log('users table exists:', rows.length > 0);
    if (rows.length > 0) {
      const [cols] = await pool.execute('SHOW COLUMNS FROM users');
      console.log('columns:', cols.map(c => c.Field).join(', '));
    }
  } catch (err) {
    console.error('ERROR:', err.message || err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
