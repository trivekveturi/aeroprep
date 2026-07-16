/**
 * Run once to create users, user_progress, and attempts tables in pilot_exam.
 * Usage: node scripts/setup-db.mjs
 */
import mysql from 'mysql2/promise';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const conn = await mysql.createConnection({
  host: 'localhost',
  port: 3306,
  database: 'pilot_exam',
  user: 'root',
  password: 'veturi123',
  multipleStatements: true,
});

console.log('✅ Connected to MySQL pilot_exam');

// ── Create tables ──────────────────────────────────────────────────
await conn.execute(`
  CREATE TABLE IF NOT EXISTS users (
    id           VARCHAR(36)  NOT NULL PRIMARY KEY,
    username     VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_username (username)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`);
console.log('✅ Table: users');

await conn.execute(`
  CREATE TABLE IF NOT EXISTS user_progress (
    user_id              VARCHAR(36) NOT NULL PRIMARY KEY,
    goal                 VARCHAR(50) NULL,
    streak               INT         NOT NULL DEFAULT 0,
    last_study_date      DATE        NULL,
    questions_attempted  INT         NOT NULL DEFAULT 0,
    flagged_questions    JSON        NOT NULL,
    CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`);
console.log('✅ Table: user_progress');

await conn.execute(`
  CREATE TABLE IF NOT EXISTS attempts (
    id                VARCHAR(36)          NOT NULL PRIMARY KEY,
    user_id           VARCHAR(36)          NOT NULL,
    subject_id        VARCHAR(200)         NOT NULL,
    type              ENUM('practice','mock') NOT NULL,
    score             INT                  NOT NULL,
    correct_count     INT                  NOT NULL,
    wrong_count       INT                  NOT NULL,
    skipped_count     INT                  NOT NULL,
    total_count       INT                  NOT NULL,
    duration_seconds  INT                  NOT NULL DEFAULT 0,
    chapter_breakdown JSON                 NULL,
    completed_at      DATETIME             NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attempts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_attempts_user (user_id),
    INDEX idx_attempts_user_subject (user_id, subject_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`);
console.log('✅ Table: attempts');

// ── Migrate existing JSON users if present ─────────────────────────
const usersFile = join(__dirname, '..', 'app-data', 'users.json');
if (existsSync(usersFile)) {
  const users = JSON.parse(readFileSync(usersFile, 'utf8'));
  let migrated = 0;
  for (const u of users) {
    try {
      await conn.execute(
        `INSERT IGNORE INTO users (id, username, display_name, password_hash, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [u.id, u.username, u.displayName, u.passwordHash, new Date(u.createdAt)]
      );

      // Migrate their progress too
      const progressFile = join(__dirname, '..', 'app-data', 'progress', `${u.id}.json`);
      if (existsSync(progressFile)) {
        const p = JSON.parse(readFileSync(progressFile, 'utf8'));

        await conn.execute(
          `INSERT IGNORE INTO user_progress
             (user_id, goal, streak, last_study_date, questions_attempted, flagged_questions)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [u.id, p.goal ?? null, p.streak ?? 0, p.lastStudyDate ?? null,
           p.questionsAttempted ?? 0, JSON.stringify(p.flaggedQuestions ?? [])]
        );

        for (const a of (p.attempts ?? [])) {
          await conn.execute(
            `INSERT IGNORE INTO attempts
               (id, user_id, subject_id, type, score, correct_count, wrong_count,
                skipped_count, total_count, duration_seconds, chapter_breakdown, completed_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [a.id, u.id, a.subjectId, a.type, a.score, a.correct, a.wrong,
             a.skipped, a.total, a.durationSeconds ?? 0,
             a.chapterBreakdown ? JSON.stringify(a.chapterBreakdown) : null,
             new Date(a.completedAt)]
          );
        }
      } else {
        // Create empty progress row
        await conn.execute(
          `INSERT IGNORE INTO user_progress
             (user_id, goal, streak, last_study_date, questions_attempted, flagged_questions)
           VALUES (?, NULL, 0, NULL, 0, '[]')`,
          [u.id]
        );
      }
      migrated++;
    } catch (e) {
      console.warn(`  ⚠ Could not migrate user ${u.username}:`, e.message);
    }
  }
  if (migrated > 0) console.log(`✅ Migrated ${migrated} user(s) from JSON`);
}

await conn.end();
console.log('\n🚀 Database setup complete. Restart the app with: npm run dev');
