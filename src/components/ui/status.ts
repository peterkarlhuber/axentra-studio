export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'brand';

const STATUS_TONES: Record<string, Tone> = {
  active: 'success',
  ok: 'success',
  ready: 'success',
  healthy: 'success',
  pass: 'success',
  accepted: 'success',
  success: 'success',
  pending: 'info',
  invited: 'info',
  degraded: 'warning',
  expired: 'warning',
  archived: 'neutral',
  disabled: 'danger',
  revoked: 'danger',
  failed: 'danger',
  error: 'danger',
  down: 'danger',
  unavailable: 'danger',
  failure: 'danger',
  suspended: 'warning',
  fail: 'danger',
  denied: 'danger',
};

export function toneForStatus(status: string | null | undefined): Tone {
  return (status && STATUS_TONES[status.toLowerCase()]) || 'neutral';
}
