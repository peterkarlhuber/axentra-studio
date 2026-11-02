/**
 * Minimal parser for the Prometheus text exposition format 0.0.4 as served by
 * `GET /metrics`, plus helpers that turn families into readable rows.
 */
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary' | 'untyped';

export interface Sample {
  name: string;
  labels: Record<string, string>;
  value: number;
}

export interface MetricFamily {
  name: string;
  type: MetricType;
  help: string;
  samples: Sample[];
}

const SUFFIXES = ['_bucket', '_sum', '_count', '_created'];

function parseLabels(source: string): Record<string, string> {
  const labels: Record<string, string> = {};
  let index = 0;
  while (index < source.length) {
    while (source[index] === ',' || source[index] === ' ') index += 1;
    const eq = source.indexOf('=', index);
    if (eq < 0) break;
    const name = source.slice(index, eq).trim();
    index = eq + 1;
    if (source[index] !== '"') break;
    index += 1;
    let value = '';
    while (index < source.length && source[index] !== '"') {
      if (source[index] === '\\' && index + 1 < source.length) {
        const next = source[index + 1];
        value += next === 'n' ? '\n' : (next as string);
        index += 2;
      } else {
        value += source[index];
        index += 1;
      }
    }
    index += 1; // closing quote
    if (name) labels[name] = value;
  }
  return labels;
}

function parseValue(text: string): number {
  if (text === '+Inf') return Infinity;
  if (text === '-Inf') return -Infinity;
  return Number(text);
}

/** Parse the exposition text. Unknown or malformed lines are skipped. */
export function parsePrometheus(text: string): MetricFamily[] {
  const families = new Map<string, MetricFamily>();
  const family = (name: string): MetricFamily => {
    let entry = families.get(name);
    if (!entry) {
      entry = { name, type: 'untyped', help: '', samples: [] };
      families.set(name, entry);
    }
    return entry;
  };
  const owner = (sampleName: string): MetricFamily => {
    if (families.has(sampleName)) return families.get(sampleName) as MetricFamily;
    for (const suffix of SUFFIXES) {
      if (sampleName.endsWith(suffix)) {
        const base = sampleName.slice(0, -suffix.length);
        const known = families.get(base);
        if (known && (known.type === 'histogram' || known.type === 'summary')) return known;
      }
    }
    return family(sampleName);
  };

  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('#')) {
      const match = /^#\s*(HELP|TYPE)\s+(\S+)\s*(.*)$/.exec(line);
      if (!match) continue;
      const [, kind, name, rest] = match as unknown as [string, string, string, string];
      if (kind === 'HELP') family(name).help = rest.replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
      else {
        const type = rest.trim() as MetricType;
        family(name).type = ['counter', 'gauge', 'histogram', 'summary'].includes(type)
          ? type
          : 'untyped';
      }
      continue;
    }
    const match = /^([a-zA-Z_:][a-zA-Z0-9_:]*)(\{(.*)\})?\s+(\S+)(\s+\S+)?$/.exec(line);
    if (!match) continue;
    const [, name, , labelText, valueText] = match as unknown as [
      string,
      string,
      string | undefined,
      string | undefined,
      string,
    ];
    const value = parseValue(valueText);
    if (Number.isNaN(value) && valueText !== 'NaN') continue;
    owner(name).samples.push({ name, labels: labelText ? parseLabels(labelText) : {}, value });
  }
  return [...families.values()];
}

export interface MetricRow {
  labels: Record<string, string>;
  value: number;
}

export interface HistogramRow {
  labels: Record<string, string>;
  count: number;
  sum: number;
}

/** Counter/gauge rows, largest first. */
export function valueRows(family: MetricFamily): MetricRow[] {
  return family.samples
    .filter((sample) => sample.name === family.name || family.type === 'untyped')
    .map(({ labels, value }) => ({ labels, value }))
    .sort((a, b) => b.value - a.value);
}

/** Histogram/summary rows (count and sum per label set, ignoring buckets), most frequent first. */
export function histogramRows(family: MetricFamily): HistogramRow[] {
  const rows = new Map<string, HistogramRow>();
  for (const sample of family.samples) {
    const isCount = sample.name === `${family.name}_count`;
    const isSum = sample.name === `${family.name}_sum`;
    if (!isCount && !isSum) continue;
    const key = JSON.stringify(Object.entries(sample.labels).sort());
    const row = rows.get(key) ?? { labels: sample.labels, count: 0, sum: 0 };
    if (isCount) row.count = sample.value;
    else row.sum = sample.value;
    rows.set(key, row);
  }
  return [...rows.values()].sort((a, b) => b.count - a.count);
}

/** Sum of a family's own samples, optionally only those matching `filter`. */
export function total(
  family: MetricFamily | undefined,
  filter: (labels: Record<string, string>) => boolean = () => true,
): number | undefined {
  if (!family) return undefined;
  return valueRows(family)
    .filter((row) => filter(row.labels))
    .reduce((sum, row) => sum + row.value, 0);
}

export function labelNames(rows: { labels: Record<string, string> }[]): string[] {
  const names = new Set<string>();
  rows.forEach((row) => Object.keys(row.labels).forEach((name) => names.add(name)));
  return [...names];
}

export const METRIC_GROUPS = ['http', 'auth', 'database', 'notify', 'jobs', 'other'] as const;
export type MetricGroup = (typeof METRIC_GROUPS)[number];

export function groupOf(name: string): MetricGroup {
  if (name.startsWith('axentra_http_')) return 'http';
  if (name.startsWith('axentra_auth_')) return 'auth';
  if (name.startsWith('axentra_db_')) return 'database';
  if (name.startsWith('axentra_notify_')) return 'notify';
  if (
    name.startsWith('axentra_jobs_') ||
    name.startsWith('axentra_job_') ||
    name.startsWith('axentra_events_') ||
    name.startsWith('axentra_webhook')
  ) {
    return 'jobs';
  }
  return 'other';
}
