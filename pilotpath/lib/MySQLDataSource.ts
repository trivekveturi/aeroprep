/**
 * MySQLDataSource — reads from pilot_exam MySQL database.
 *
 * KEY DESIGN DECISION:
 *   - chapter IDs used internally = RAW quiz.quiz values from the DB (e.g. "dgca-met-01-dgca-met-01-atmosphere")
 *   - chapter display names shown in UI = cleanChapterName(raw) (e.g. "Atmosphere")
 *   - Subject.chapters[] stores RAW values so filtering always matches exactly
 *   - The chapter page URL encodes the raw value; the UI displays the cleaned version
 *
 * This avoids every raw→clean→match roundtrip bug.
 */
import mysql from 'mysql2/promise';
import { DataSource, Subject, Question } from './types';
import { cleanChapterDisplay } from './chapterUtils';

const DEFAULT_ICONS  = ['🌦️','⚖️','⚙️','🧭','📡','🛩️','🎓','📋','🔬','🌍'];
const DEFAULT_COLORS = ['#00D4AA','#F5A623','#4FB3E8','#1B6CA8','#FF4D6A','#2E86D4','#00A882','#FFD080'];

function rotate<T>(arr: T[], idx: number): T {
  return arr[idx % arr.length];
}

/** Clean a subject slug: "01-aviation-meteorology" → "Aviation Meteorology" */
function cleanSubjectName(str: string): string {
  return str
    .replace(/^\d+-/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

/** Strip "Q25." / "1." number prefix from question text */
function cleanQuestionText(text: string): string {
  return text
    .replace(/^Q\d+\.\s*/i, '')
    .replace(/^\d+\.\s+/, '')
    .trim();
}

/** Strip "A." / "(A)" option letter prefix */
function cleanOptionText(text: string): string {
  return text
    .replace(/^\([A-Da-d]\)\s*/, '')
    .replace(/^[A-Da-d][.)]\s*/, '')
    .trim();
}

// ── Shared pool ────────────────────────────────────────────────────
let _pool: mysql.Pool | null = null;
function getPool(): mysql.Pool {
  if (_pool) return _pool;
  _pool = mysql.createPool({
    host:               process.env.MYSQL_HOST     ?? 'localhost',
    port:               Number(process.env.MYSQL_PORT ?? 3306),
    database:           process.env.MYSQL_DATABASE ?? 'pilot_exam',
    user:               process.env.MYSQL_USER     ?? 'root',
    password:           process.env.MYSQL_PASSWORD ?? '',
    waitForConnections: true,
    connectionLimit:    10,
  });
  return _pool;
}

interface QuestionRow {
  id: number;
  quiz_id: number;
  hdq_id: string | null;
  question: string;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  correct_answer: string | null;
  explanation: string | null;
  subject: string;
  quiz: string;         // raw quiz slug — used as chapter ID
}

function rowToQuestion(row: QuestionRow): Question {
  const options = [row.option_a, row.option_b, row.option_c, row.option_d]
    .filter((o): o is string => o !== null && o.trim() !== '')
    .map(cleanOptionText);

  return {
    id:             String(row.id),
    question:       cleanQuestionText(row.question),
    options,
    correct_answer: cleanOptionText(row.correct_answer?.trim() ?? ''),
    explanation:    row.explanation ?? undefined,
    // chapter = RAW quiz slug (used for filtering); display name derived on the frontend
    chapter:        row.quiz ?? undefined,
    image:          row.hdq_id ?? undefined,
  };
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class MySQLDataSource implements DataSource {
  private _subjectsCache: Subject[] | null = null;

  async listSubjects(): Promise<Subject[]> {
    if (this._subjectsCache) return this._subjectsCache;
    const pool = getPool();

    const [rows] = await pool.execute<mysql.RowDataPacket[]>(`
      SELECT
        qz.subject,
        COUNT(qs.id)                                                     AS question_count,
        GROUP_CONCAT(DISTINCT qz.quiz ORDER BY qz.quiz SEPARATOR '|||')  AS chapters
      FROM quizzes qz
      LEFT JOIN questions qs ON qs.quiz_id = qz.id
      GROUP BY qz.subject
      ORDER BY qz.subject
    `);

    const subjects: Subject[] = (rows as Array<{
      subject: string; question_count: number; chapters: string | null;
    }>).map((row, idx) => {
      // chapters[] stores RAW quiz slugs — exact match for filtering
      const rawChapters = row.chapters
        ? row.chapters.split('|||').filter(Boolean)
        : [];

      return {
        id:            row.subject,
        order:         idx + 1,
        name:          cleanSubjectName(row.subject),
        icon:          rotate(DEFAULT_ICONS, idx),
        color:         rotate(DEFAULT_COLORS, idx),
        questionCount: Number(row.question_count),
        chapters:      rawChapters.length > 0 ? rawChapters : undefined,
      };
    });

    this._subjectsCache = subjects;
    return subjects;
  }

  async getSubject(id: string): Promise<Subject | null> {
    const all = await this.listSubjects();
    return all.find(s => s.id === id) ?? null;
  }

  async getQuestions(params: {
    subjectId: string;
    chapterId?: string;   // RAW quiz slug from Subject.chapters[]
    limit?: number;
    shuffle?: boolean;
  }): Promise<Question[]> {
    const pool = getPool();

    // Build query — filter by raw quiz slug directly in SQL (exact match, no cleaning needed)
    let sql = `
      SELECT qs.*, qz.subject, qz.quiz
      FROM questions qs
      JOIN quizzes qz ON qz.id = qs.quiz_id
      WHERE qz.subject = ?
    `;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bindings: any[] = [params.subjectId];

    if (params.chapterId) {
      sql += ` AND qz.quiz = ?`;
      bindings.push(params.chapterId);
    }

    sql += ` ORDER BY qs.id`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(sql, bindings as any);
    let questions = (rows as QuestionRow[]).map(rowToQuestion);

    if (params.shuffle) shuffle(questions);
    if (params.limit && params.limit < questions.length) {
      questions = questions.slice(0, params.limit);
    }

    return questions;
  }

  async getMockTest(params: { subjectId?: string; count: number }): Promise<Question[]> {
    const pool = getPool();

    let sql = `
      SELECT qs.*, qz.subject, qz.quiz
      FROM questions qs
      JOIN quizzes qz ON qz.id = qs.quiz_id
    `;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bindings: any[] = [];

    if (params.subjectId && params.subjectId !== 'all') {
      sql += ` WHERE qz.subject = ?`;
      bindings.push(params.subjectId);
    }

    sql += ` ORDER BY RAND() LIMIT ?`;
    bindings.push(params.count);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(sql, bindings as any);
    return (rows as QuestionRow[]).map(rowToQuestion);
  }
}
