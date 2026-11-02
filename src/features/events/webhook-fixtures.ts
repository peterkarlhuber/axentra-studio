import { PID } from './test-helpers';

export const endpoint = {
  id: 'whk_1',
  product_id: PID,
  tenant_id: null,
  url: 'https://hooks.example.com/axentra',
  description: 'CRM sync',
  event_types: ['invoice.*'],
  enabled: true,
  version: 2,
  has_previous_secret: false,
  previous_secret_expires_at: null,
  created_by: 'usr_1',
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
};

export const delivery = {
  id: 'dlv_1',
  product_id: PID,
  tenant_id: null,
  endpoint_id: 'whk_1',
  event_id: 'evt_1',
  event_type: 'invoice.created',
  status: 'dead',
  attempts: 8,
  response_code: 500,
  response_body: 'Internal Server Error',
  duration_ms: 12,
  last_error: 'HTTP 500',
  next_attempt_at: null,
  job_id: 'job_7',
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
  delivered_at: null,
};
