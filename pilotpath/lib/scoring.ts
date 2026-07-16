/**
 * lib/scoring.ts — Pure, isolated scoring module.
 * All scoring logic lives here. No side effects, no imports from other app code.
 *
 * FORMULA documented:
 *   Exam Readiness = 40% coverage + 40% accuracy + 20% recent mock average
 *   - coverage  = questionsAttempted / totalAvailable (capped at 100%)
 *   - accuracy  = average correct% across all practice attempts
 *   - mockAvg   = average score of last 3 mock attempts (0 if none)
 */
import type { AttemptRecord, ReadinessBreakdown } from './types';

// ── Basic attempt stats ───────────────────────────────────────────

export function calculateScore(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export function scoreColor(pct: number): string {
  if (pct >= 75) return '#00D4AA'; // green
  if (pct >= 50) return '#F5A623'; // amber
  return '#FF4D6A';                // red
}

export function scoreLabel(pct: number): string {
  if (pct >= 85) return 'Excellent';
  if (pct >= 75) return 'Good';
  if (pct >= 60) return 'Pass';
  return 'Needs Work';
}

// ── Readiness formula ─────────────────────────────────────────────

export function computeReadiness(
  attempts: AttemptRecord[],
  totalAvailableQuestions: number,
  questionsAttempted: number,
): ReadinessBreakdown {
  // Coverage (capped at 1.0)
  const coverage = totalAvailableQuestions > 0
    ? Math.min(questionsAttempted / totalAvailableQuestions, 1)
    : 0;

  // Accuracy: average correct% across all attempts
  const allAttempts = attempts.filter(a => a.total > 0);
  const accuracy = allAttempts.length > 0
    ? allAttempts.reduce((sum, a) => sum + (a.correct / a.total), 0) / allAttempts.length
    : 0;

  // Mock average: last 3 mock attempts
  const mocks = attempts.filter(a => a.type === 'mock').slice(-3);
  const mockAvg = mocks.length > 0
    ? mocks.reduce((sum, a) => sum + a.score / 100, 0) / mocks.length
    : 0;

  const rawScore = (coverage * 0.4) + (accuracy * 0.4) + (mockAvg * 0.2);
  const score = Math.round(rawScore * 100);

  // Weak chapters: chapters with < 60% accuracy across attempts
  const chapterStats: Record<string, { correct: number; total: number }> = {};
  for (const attempt of attempts) {
    if (!attempt.chapterBreakdown) continue;
    for (const [chapter, stats] of Object.entries(attempt.chapterBreakdown)) {
      if (!chapterStats[chapter]) chapterStats[chapter] = { correct: 0, total: 0 };
      chapterStats[chapter].correct += stats.correct;
      chapterStats[chapter].total  += stats.total;
    }
  }
  const weakChapters = Object.entries(chapterStats)
    .filter(([, s]) => s.total > 0 && (s.correct / s.total) < 0.6)
    .map(([chapter]) => chapter);

  let label = 'Just Starting';
  if (score >= 85) label = 'Ready to Fly';
  else if (score >= 70) label = 'Almost Ready';
  else if (score >= 50) label = 'On Track';
  else if (score >= 25) label = 'Building Base';

  return {
    score,
    coverage: Math.round(coverage * 100),
    accuracy: Math.round(accuracy * 100),
    mockAvg:  Math.round(mockAvg * 100),
    label,
    weakChapters,
  };
}

// ── SVG ring helper (used in both mobile + web readiness rings) ───

export function svgRingDashOffset(pct: number, radius: number): number {
  const circumference = 2 * Math.PI * radius;
  return circumference - (pct / 100) * circumference;
}
