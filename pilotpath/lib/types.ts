// ── Core Data Types ──────────────────────────────────────────────
// These interfaces are the contract between the data layer and the UI.
// All UI code depends only on these types, never on file structures.

export interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;   // exact string matching one of options[]
  explanation?: string;
  chapter?: string;
  difficulty?: string;
  formula?: string;
  image?: string;
}

export interface Subject {
  id: string;          // folder name e.g. "01-meteorology"
  order: number;       // leading number parsed from folder name
  name: string;        // display name e.g. "Meteorology"
  icon: string;        // emoji
  color: string;       // hex color
  questionCount: number;
  chapters?: string[]; // unique chapter names found in questions; undefined if none
}

// ── DataSource interface ──────────────────────────────────────────
// Swap implementations by changing getDataSource() in lib/datasource.ts
export interface DataSource {
  listSubjects(): Promise<Subject[]>;
  getSubject(id: string): Promise<Subject | null>;
  getQuestions(params: {
    subjectId: string;
    chapterId?: string;
    limit?: number;
    shuffle?: boolean;
  }): Promise<Question[]>;
  getMockTest(params: {
    subjectId?: string;
    count: number;
  }): Promise<Question[]>;
}

// ── User & Auth ───────────────────────────────────────────────────
export interface User {
  id: string;
  username: string;     // unique login handle
  displayName: string;
  passwordHash: string; // bcrypt hash — NEVER plaintext
  createdAt: string;    // ISO date string
}

export type Goal =
  | 'pass-dgca'
  | 'airline-cadet'
  | 'classes'
  | 'explore';

// ── Progress Store types ──────────────────────────────────────────
// Stored per user, keyed by userId
export interface AttemptRecord {
  id: string;
  subjectId: string;
  type: 'practice' | 'mock';
  score: number;        // percentage 0-100
  correct: number;
  wrong: number;
  skipped: number;
  total: number;
  durationSeconds: number;
  completedAt: string;  // ISO date string
  chapterBreakdown?: Record<string, { correct: number; total: number }>;
}

export interface UserProgress {
  userId: string;
  goal: Goal | null;
  streak: number;
  lastStudyDate: string | null; // ISO date YYYY-MM-DD
  questionsAttempted: number;
  attempts: AttemptRecord[];
  flaggedQuestions: string[];   // question ids
}

// ── ProgressStore interface ───────────────────────────────────────
// Swap to database by implementing this interface
export interface ProgressStore {
  getProgress(userId: string): Promise<UserProgress>;
  updateGoal(userId: string, goal: Goal): Promise<void>;
  saveAttempt(userId: string, attempt: AttemptRecord): Promise<void>;
  flagQuestion(userId: string, questionId: string): Promise<void>;
  unflagQuestion(userId: string, questionId: string): Promise<void>;
  incrementStreak(userId: string): Promise<void>;
}

// ── Session payload (stored in signed JWT cookie) ─────────────────
export interface SessionPayload {
  userId: string;
  username: string;
  displayName: string;
}

// ── Readiness score (documented formula) ─────────────────────────
// Weighted: 40% coverage + 40% accuracy + 20% recent mock scores
// Coverage = questionsAttempted / totalAvailableQuestions (capped at 1)
// Accuracy = average accuracy across all practice attempts
// MockScore = average of last 3 mock scores (0 if none)
export interface ReadinessBreakdown {
  score: number;        // 0-100
  coverage: number;     // 0-100
  accuracy: number;     // 0-100
  mockAvg: number;      // 0-100
  label: string;        // human-readable description
  weakChapters: string[];
}
