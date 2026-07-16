import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { User } from './types';

interface MySQLUserRow {
  id: string;
  username: string;
  display_name: string;
  password_hash: string;
  created_at: Date | string;
}

let _pool: mysql.Pool | null = null;
function getPool() {
  if (_pool) return _pool;
  _pool = mysql.createPool({
    host:               process.env.MYSQL_HOST     ?? 'localhost',
    port:               Number(process.env.MYSQL_PORT ?? 3306),
    database:           process.env.MYSQL_DATABASE ?? 'pilot_exam',
    user:               process.env.MYSQL_USER     ?? 'root',
    password:           process.env.MYSQL_PASSWORD ?? '',
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0,
  });
  return _pool;
}

let usersTableInitialized = false;
async function ensureUsersTable(): Promise<void> {
  if (usersTableInitialized) return;
  const pool = getPool();
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id CHAR(36) NOT NULL PRIMARY KEY,
      username VARCHAR(191) NOT NULL UNIQUE,
      display_name VARCHAR(191) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at DATETIME NOT NULL,
      INDEX idx_username(username)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  usersTableInitialized = true;
}

function rowToUser(row: MySQLUserRow): User {
  const createdAt = row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at);
  return {
    id:           row.id,
    username:     row.username,
    displayName:  row.display_name,
    passwordHash: row.password_hash,
    createdAt,
  };
}

export class MySQLUserStore {
  async findByUsername(username: string): Promise<User | null> {
    await ensureUsersTable();
    const pool = getPool();
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT id, username, display_name, password_hash, created_at FROM users WHERE username = ? LIMIT 1',
      [username.trim().toLowerCase()],
    );
    const row = (rows as MySQLUserRow[])[0];
    return row ? rowToUser(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    await ensureUsersTable();
    const pool = getPool();
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT id, username, display_name, password_hash, created_at FROM users WHERE id = ? LIMIT 1',
      [id],
    );
    const row = (rows as MySQLUserRow[])[0];
    return row ? rowToUser(row) : null;
  }

  async create(params: { username: string; displayName: string; password: string }): Promise<User> {
    await ensureUsersTable();
    const existing = await this.findByUsername(params.username);
    if (existing) throw new Error('Username already taken');

    const passwordHash = await bcrypt.hash(params.password, 12);
    const user: User = {
      id:           randomUUID(),
      username:     params.username.trim(),
      displayName:  params.displayName.trim(),
      passwordHash,
      createdAt:    new Date().toISOString(),
    };

    const pool = getPool();
    await pool.execute(
      'INSERT INTO users (id, username, display_name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)',
      [user.id, user.username, user.displayName, user.passwordHash, user.createdAt],
    );

    return user;
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }
}
