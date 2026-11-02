/**
 * Syntax check for Axentra's 5-field cron (UTC): `minute hour day-of-month month day-of-week`.
 * Mirrors the rules of the backend parser (`axentra.events.cron`) so most mistakes are caught
 * before submitting: `*`, numbers, ranges `a-b`, lists `a,b`, steps `*\/n` and `a-b/n`; day
 * of week 0-7 (0 and 7 are Sunday). No names, `L`, `W`, `#`, `?` or macros. The server stays
 * authoritative (it also rejects expressions that never match, like `0 0 31 2 *`).
 */

export const CRON_FIELDS = [
  { key: 'minute', min: 0, max: 59 },
  { key: 'hour', min: 0, max: 23 },
  { key: 'dayOfMonth', min: 1, max: 31 },
  { key: 'month', min: 1, max: 12 },
  { key: 'dayOfWeek', min: 0, max: 7 },
] as const;

export type CronField = (typeof CRON_FIELDS)[number]['key'];

export type CronProblem =
  | { kind: 'fieldCount'; count: number }
  | { kind: 'syntax'; field: CronField; value: string }
  | { kind: 'range'; field: CronField; min: number; max: number };

const isDigits = (value: string) => /^\d+$/.test(value);

function checkField(text: string, index: number): CronProblem | null {
  const spec = CRON_FIELDS[index] as (typeof CRON_FIELDS)[number];
  for (const part of text.split(',')) {
    if (!part) return { kind: 'syntax', field: spec.key, value: text };
    const [range = '', step, extra] = part.split('/');
    if (extra !== undefined) return { kind: 'syntax', field: spec.key, value: part };
    if (step !== undefined && (!isDigits(step) || Number(step) < 1)) {
      return { kind: 'syntax', field: spec.key, value: part };
    }
    let start: number;
    let end: number;
    if (range === '*') {
      start = spec.min;
      end = spec.max;
    } else if (range.includes('-')) {
      const [a = '', b = '', ...rest] = range.split('-');
      if (rest.length > 0 || !isDigits(a) || !isDigits(b)) {
        return { kind: 'syntax', field: spec.key, value: part };
      }
      start = Number(a);
      end = Number(b);
    } else if (isDigits(range)) {
      start = Number(range);
      end = step !== undefined ? spec.max : start;
    } else {
      return { kind: 'syntax', field: spec.key, value: part };
    }
    if (start < spec.min || end > spec.max || start > end) {
      return { kind: 'range', field: spec.key, min: spec.min, max: spec.max };
    }
  }
  return null;
}

export function validateCron(expression: string): CronProblem | null {
  const parts = expression.trim().split(/\s+/).filter(Boolean);
  if (parts.length !== 5) return { kind: 'fieldCount', count: parts.length };
  for (let index = 0; index < parts.length; index += 1) {
    const problem = checkField(parts[index] as string, index);
    if (problem) return problem;
  }
  return null;
}

/** Ready-made expressions offered in the schedule form. */
export const CRON_PRESETS = [
  { id: 'everyFiveMinutes', expression: '*/5 * * * *' },
  { id: 'hourly', expression: '0 * * * *' },
  { id: 'dailyMidnight', expression: '0 0 * * *' },
  { id: 'weekdaysNine', expression: '0 9 * * 1-5' },
  { id: 'weeklyMonday', expression: '0 6 * * 1' },
  { id: 'monthlyFirst', expression: '0 0 1 * *' },
] as const;

/** Translated explanation of a problem (keys in the `events` namespace). */
export function cronProblemText(
  t: (key: string, options?: Record<string, unknown>) => string,
  problem: CronProblem,
) {
  switch (problem.kind) {
    case 'fieldCount':
      return t('validation.cron.fieldCount', { count: problem.count });
    case 'syntax':
      return t('validation.cron.syntax', {
        field: t(`cronField.${problem.field}`),
        value: problem.value,
      });
    case 'range':
      return t('validation.cron.range', {
        field: t(`cronField.${problem.field}`),
        min: problem.min,
        max: problem.max,
      });
  }
}
