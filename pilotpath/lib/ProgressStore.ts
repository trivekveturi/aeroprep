/**
 * ProgressStore — MySQL implementation.
 * Per-user progress stored in user_progress + attempts tables.
 *
 * SWAP: implement the ProgressStore interface and return from getProgressStore().
 */
import mysql from 'mysql2/promise';
import { randomUUID } from 'crypto';
import { UserProgress, AttemptRecord, Goal, ProgressStore } from './types';

function getPool(): mysql.Pool {
  if (!(global as Record<string, unknown>).__progressPool) {
    (global as Record<string, unknown>).__progressPool = mysql.createPool({
      host:               process.env.MYSQL_HOST     ?? 'localhost',
      port:               Number(process.env.MYSQL_PORT ?? 3306),
      database:           process.env.MYSQL_DATABASE ?? 'pilot_exam',
      user:               process.env.MYSQL_USER     ?? 'root',
      password:           process.env.MYSQL_PASSWORD ?? '',
      waitForConnections: true,
      connectionLimit:    5,
    });
  }
  return (global as Record<string, unknown>).__progressPool as mysql.Pool;
}

function defaultProgress(userId: string): UserProgress {
  return {
    userId,
    goal: null,
    streak: 0,
    lastStudyDate: null,
    questionsAttempted: 0,
    attempts: [],
    flaggedQuestions: [],
  };
}

class MySQLProgressStore implements ProgressStore {
  async getProgress(userId: string): Promise<UserProgress> {
    const pool = getPool();

    // Ensure progress row exists
    await pool.execute(
      `INSERT IGNORE INTO user_progress
         (user_id, goal, streak, last_study_date, questions_attempted, flagged_questions)
       VALUES (?, NULL, 0, NULL, 0, '[]')`,
      [userId]
    );

    const [progRows] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT * FROM user_progress WHERE user_id = ? LIMIT 1',
      [userId]
    );

    const [attemptRows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT * FROM attempts WHERE user_id = ? ORDER BY completed_at ASC`,
      [userId]
    );

    if (!progRows.length) return defaultProgress(userId);

    const p = progRows[0];
    const attempts: AttemptRecord[] = (attemptRows as mysql.RowDataPacket[]).map(a => ({
      id:               a.id,
      subjectId:        a.subject_id,
      type:             a.type as 'practice' | 'mock',
      score:            a.score,
      correct:          a.correct_count,
      wrong:            a.wrong_count,
      skipped:          a.skipped_count,
      total:            a.total_count,
      durationSeconds:  a.duration_seconds,
      completedAt:      a.completed_at instanceof Date
                          ? a.completed_at.toISOString()
                          : String(a.completed_at),
      chapterBreakdown: a.chapter_breakdown
                          ? (typeof a.chapter_breakdown === 'string'
                              ? JSON.parse(a.chapter_breakdown)
                              : a.chapter_breakdown)
                          : undefined,
    }));

    return {
      userId,
      goal:               p.goal ?? null,
      streak:             p.streak ?? 0,
      lastStudyDate:      p.last_study_date
                            ? (p.last_study_date instanceof Date
                                ? p.last_study_date.toISOString().slice(0,10)
                                : String(p.last_study_date).slice(0,10))
                            : null,
      questionsAttempted: p.questions_attempted ?? 0,
      attempts,
      flaggedQuestions:   typeof p.flagged_questions === 'string'
                            ? JSON.parse(p.flagged_questions)
                            : (p.flagged_questions ?? []),
    };
  }

  async updateGoal(userId: string, goal: Goal): Promise<void> {
    const pool = getPool();
    await pool.execute(
      `UPDATE user_progress SET goal = ? WHERE user_id = ?`,
      [goal, userId]
    );
  }

  async saveAttempt(userId: string, attempt: Omit<AttemptRecord,'id'> & { id?: string }): Promise<void> {
    const pool = getPool();
    const id  = attempt.id ?? randomUUID();
    const now = new Date();

    await pool.execute(
      `INSERT INTO attempts
         (id, user_id, subject_id, type, score, correct_count, wrong_count,
          skipped_count, total_count, duration_seconds, chapter_breakdown, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, userId, attempt.subjectId, attempt.type,
        attempt.score, attempt.correct, attempt.wrong,
        attempt.skipped, attempt.total, attempt.durationSeconds ?? 0,
        attempt.chapterBreakdown ? JSON.stringify(attempt.chapterBreakdown) : null,
        new Date(attempt.completedAt ?? now),
      ]
    );

    // Update streak and questions_attempted
    const today     = now.toISOString().slice(0,10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);

    await pool.execute(
      `UPDATE user_progress
       SET questions_attempted = questions_attempted + ?,
           streak = CASE
             WHEN last_study_date = ? THEN streak          -- same day, no change
             WHEN last_study_date = ? THEN streak + 1      -- yesterday, increment
             ELSE 1                                        -- gap, reset to 1
           END,
           last_study_date = ?
       WHERE user_id = ?`,
      [attempt.total, today, yesterday, today, userId]
    );
  }

  async flagQuestion(userId: string, questionId: string): Promise<void> {
    const pool = getPool();
    // Use JSON_CONTAINS to avoid duplicates
    await pool.execute(
      `UPDATE user_progress
       SET flagged_questions = IF(
         JSON_CONTAINS(flagged_questions, JSON_QUOTE(?)),
         flagged_questions,
         JSON_ARRAY_APPEND(flagged_questions, '$', ?)
       )
       WHERE user_id = ?`,
      [questionId, questionId, userId]
    );
  }

  async unflagQuestion(userId: string, questionId: string): Promise<void> {
    const pool = getPool();
    // Remove the element from the JSON array
    await pool.execute(
      `UPDATE user_progress
       SET flagged_questions = JSON_REMOVE(
         flagged_questions,
         REPLACE(JSON_SEARCH(flagged_questions, 'one', ?), '"', '')
       )
       WHERE user_id = ?
         AND JSON_CONTAINS(flagged_questions, JSON_QUOTE(?))`,
      [questionId, userId, questionId]
    );
  }

  async incrementStreak(userId: string): Promise<void> {
    const pool = getPool();
    await pool.execute(
      'UPDATE user_progress SET streak = streak + 1 WHERE user_id = ?',
      [userId]
    );
  }
}

let _store: ProgressStore | null = null;
export function getProgressStore(): ProgressStore {
  if (!_store) _store = new MySQLProgressStore();
  return _store;
}
