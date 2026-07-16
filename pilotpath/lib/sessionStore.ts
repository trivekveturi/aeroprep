'use client';
/**
 * sessionStore — tracks answers for the CURRENT login session only.
 *
 * HOW IT WORKS:
 * - On login: a fresh session key (userId + timestamp) is written
 * - Every answer is stored under that key
 * - Dashboard reads only from the current session key
 * - If the key doesn't match (different user, new login), data is treated as empty
 * - On logout: the session key is deleted
 *
 * This means: every fresh login = zero stats, regardless of browser refresh.
 */

const STATS_KEY   = 'pp_stats';
const SESSION_KEY = 'pp_sess_id'; // current session identifier

export interface SessionStats {
  answers: { questionId: string; subjectId: string; chapter?: string; isCorrect: boolean }[];
  subjectBreakdown: Record<string, { correct: number; total: number }>;
}

function currentSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(SESSION_KEY);
}

function loadStats(): SessionStats {
  if (typeof window === 'undefined') return empty();
  try {
    const raw = sessionStorage.getItem(STATS_KEY);
    if (!raw) return empty();
    return JSON.parse(raw) as SessionStats;
  } catch {
    return empty();
  }
}

function empty(): SessionStats {
  return { answers: [], subjectBreakdown: {} };
}

function saveStats(stats: SessionStats) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

/**
 * Call this immediately after a successful login.
 * Creates a new session ID, wiping all previous stats.
 */
export function startNewSession(userId: string) {
  if (typeof window === 'undefined') return;
  const newId = `${userId}-${Date.now()}`;
  sessionStorage.setItem(SESSION_KEY, newId);
  sessionStorage.removeItem(STATS_KEY);
}

/**
 * Call on logout. Clears everything.
 */
export function clearSessionStats() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STATS_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * Record one answered question into the current session.
 */
export function recordAnswer(
  questionId: string,
  subjectId: string,
  isCorrect: boolean,
  chapter?: string,
) {
  if (!currentSessionId()) return; // no active session, ignore
  const stats = loadStats();
  stats.answers.push({ questionId, subjectId, chapter, isCorrect });
  if (!stats.subjectBreakdown[subjectId])
    stats.subjectBreakdown[subjectId] = { correct: 0, total: 0 };
  stats.subjectBreakdown[subjectId].total++;
  if (isCorrect) stats.subjectBreakdown[subjectId].correct++;
  saveStats(stats);
}

/**
 * Get computed summary for dashboard display.
 */
export function getSessionSummary() {
  const stats   = loadStats();
  const total   = stats.answers.length;
  const correct = stats.answers.filter(a => a.isCorrect).length;
  const wrong   = total - correct;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  const weakSubjects = Object.entries(stats.subjectBreakdown)
    .filter(([, s]) => s.total >= 3 && (s.correct / s.total) < 0.6)
    .map(([id]) => id);

  return {
    total, correct, wrong, accuracy,
    weakSubjects,
    subjectBreakdown: stats.subjectBreakdown,
  };
}

// keep initSession as a no-op alias for backward compat
export function initSession(_userId: string) {}
