/**
 * UserStore — MySQL implementation.
 * Users are stored in the `users` table in pilot_exam database.
 * Passwords are always bcrypt-hashed. Plaintext is NEVER stored.
 *
 * SWAP TO ANOTHER PROVIDER: implement the UserStore interface and
 * return your new instance from getUserStore(). Nothing else changes.
 */
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { User } from './types';

const BCRYPT_ROUNDS = 12;

// ── Interface ─────────────────────────────────────────────────────
export interface UserStore {
  findByUsername(username: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(params: { username: string; displayName: string; password: string }): Promise<User>;
  verifyPassword(user: User, password: string): Promise<boolean>;
}

// ── Shared pool (reuse the same one as MySQLDataSource) ────────────
function getPool(): mysql.Pool {
  // Import lazily to avoid circular dep — pool is created in MySQLDataSource
  // We create a separate pool here scoped to auth operations
  if (!(global as Record<string, unknown>).__userPool) {
    (global as Record<string, unknown>).__userPool = mysql.createPool({
      host:               process.env.MYSQL_HOST     ?? 'localhost',
      port:               Number(process.env.MYSQL_PORT ?? 3306),
      database:           process.env.MYSQL_DATABASE ?? 'pilot_exam',
      user:               process.env.MYSQL_USER     ?? 'root',
      password:           process.env.MYSQL_PASSWORD ?? '',
      waitForConnections: true,
      connectionLimit:    5,
    });
  }
  return (global as Record<string, unknown>).__userPool as mysql.Pool;
}

interface UserRow {
  id: string;
  username: string;
  display_name: string;
  password_hash: string;
  created_at: Date;
}

function rowToUser(row: UserRow): User {
  return {
    id:           row.id,
    username:     row.username,
    displayName:  row.display_name,
    passwordHash: row.password_hash,
    createdAt:    row.created_at instanceof Date
                    ? row.created_at.toISOString()
                    : String(row.created_at),
  };
}

class MySQLUserStore implements UserStore {
  async findByUsername(username: string): Promise<User | null> {
    const pool = getPool();
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT * FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1',
      [username]
    );
    if (!rows.length) return null;
    return rowToUser(rows[0] as UserRow);
  }

  async findById(id: string): Promise<User | null> {
    const pool = getPool();
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    if (!rows.length) return null;
    return rowToUser(rows[0] as UserRow);
  }

  async create(params: { username: string; displayName: string; password: string }): Promise<User> {
    const existing = await this.findByUsername(params.username);
    if (existing) throw new Error('Username already taken');

    const id           = randomUUID();
    const passwordHash = await bcrypt.hash(params.password, BCRYPT_ROUNDS);
    const createdAt    = new Date();

    const pool = getPool();
    await pool.execute(
      `INSERT INTO users (id, username, display_name, password_hash, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, params.username.trim(), params.displayName.trim(), passwordHash, createdAt]
    );

    // Create empty progress row for this user
    await pool.execute(
      `INSERT IGNORE INTO user_progress
         (user_id, goal, streak, last_study_date, questions_attempted, flagged_questions)
       VALUES (?, NULL, 0, NULL, 0, '[]')`,
      [id]
    );

    return {
      id,
      username:     params.username.trim(),
      displayName:  params.displayName.trim(),
      passwordHash,
      createdAt:    createdAt.toISOString(),
    };
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }
}

let _store: UserStore | null = null;
export function getUserStore(): UserStore {
  if (!_store) _store = new MySQLUserStore();
  return _store;
}
