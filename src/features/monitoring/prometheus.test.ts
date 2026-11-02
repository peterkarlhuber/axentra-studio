import { describe, expect, it } from 'vitest';
import { groupOf, histogramRows, parsePrometheus, total, valueRows } from './prometheus';

const TEXT = `# HELP axentra_http_requests_total HTTP requests by method, route template and status
# TYPE axentra_http_requests_total counter
axentra_http_requests_total{method="GET",route="/v1/meta",status="200"} 5
axentra_http_requests_total{method="POST",route="/v1/x",status="503"} 2
axentra_http_requests_total{method="GET",route="/a \\"b\\"",status="404"} 1
# HELP axentra_http_request_duration_seconds Latency
# TYPE axentra_http_request_duration_seconds histogram
axentra_http_request_duration_seconds_bucket{method="GET",route="/v1/meta",le="0.1"} 4
axentra_http_request_duration_seconds_bucket{method="GET",route="/v1/meta",le="+Inf"} 5
axentra_http_request_duration_seconds_sum{method="GET",route="/v1/meta"} 0.25
axentra_http_request_duration_seconds_count{method="GET",route="/v1/meta"} 5
# HELP axentra_db_pool_size Connections
# TYPE axentra_db_pool_size gauge
axentra_db_pool_size 3
# TYPE axentra_auth_failures_total counter
`;

describe('parsePrometheus', () => {
  const families = parsePrometheus(TEXT);
  const byName = new Map(families.map((family) => [family.name, family]));

  it('groups samples into families with type and help', () => {
    expect(families.map((family) => family.name)).toEqual([
      'axentra_http_requests_total',
      'axentra_http_request_duration_seconds',
      'axentra_db_pool_size',
      'axentra_auth_failures_total',
    ]);
    expect(byName.get('axentra_http_request_duration_seconds')?.type).toBe('histogram');
    expect(byName.get('axentra_db_pool_size')?.help).toBe('Connections');
    expect(byName.get('axentra_auth_failures_total')?.samples).toEqual([]);
  });

  it('parses labels including escaped quotes', () => {
    const rows = valueRows(byName.get('axentra_http_requests_total')!);
    expect(rows[0]).toEqual({
      labels: { method: 'GET', route: '/v1/meta', status: '200' },
      value: 5,
    });
    expect(rows.some((row) => row.labels.route === '/a "b"')).toBe(true);
  });

  it('sums counters with a label filter', () => {
    const http = byName.get('axentra_http_requests_total');
    expect(total(http)).toBe(8);
    expect(total(http, (labels) => (labels.status ?? '').startsWith('5'))).toBe(2);
    expect(total(undefined)).toBeUndefined();
  });

  it('reduces histograms to count and sum per label set', () => {
    expect(histogramRows(byName.get('axentra_http_request_duration_seconds')!)).toEqual([
      { labels: { method: 'GET', route: '/v1/meta' }, count: 5, sum: 0.25 },
    ]);
  });

  it('assigns families to groups by prefix', () => {
    expect(groupOf('axentra_notify_deliveries_total')).toBe('notify');
    expect(groupOf('axentra_db_pool_max')).toBe('database');
    expect(groupOf('myapp_x')).toBe('other');
  });
});
