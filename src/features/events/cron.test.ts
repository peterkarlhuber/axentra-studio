import { describe, expect, it } from 'vitest';
import { validateCron } from './cron';

describe('validateCron', () => {
  it.each(['* * * * *', '*/5 * * * *', '0 9 * * 1-5', '0,30 8-18/2 1 1,6,12 0', '5 4 * * 7'])(
    'accepts %s',
    (expression) => expect(validateCron(expression)).toBeNull(),
  );

  it('needs five fields', () => {
    expect(validateCron('* * * *')).toEqual({ kind: 'fieldCount', count: 4 });
    expect(validateCron('0 0 * * * *')).toEqual({ kind: 'fieldCount', count: 6 });
  });

  it('checks ranges per field', () => {
    expect(validateCron('61 * * * *')).toEqual({ kind: 'range', field: 'minute', min: 0, max: 59 });
    expect(validateCron('0 0 0 * *')).toMatchObject({ kind: 'range', field: 'dayOfMonth' });
    expect(validateCron('0 0 * 13 *')).toMatchObject({ kind: 'range', field: 'month' });
    expect(validateCron('0 0 * * 8')).toMatchObject({ kind: 'range', field: 'dayOfWeek' });
    expect(validateCron('0 5-2 * * *')).toMatchObject({ kind: 'range', field: 'hour' });
  });

  it('rejects names, macros and malformed steps like the server', () => {
    expect(validateCron('0 0 * * MON')).toMatchObject({ kind: 'syntax', field: 'dayOfWeek' });
    expect(validateCron('@daily')).toMatchObject({ kind: 'fieldCount' });
    expect(validateCron('*/0 * * * *')).toMatchObject({ kind: 'syntax', field: 'minute' });
    expect(validateCron('1,,2 * * * *')).toMatchObject({ kind: 'syntax', field: 'minute' });
    expect(validateCron('L * * * *')).toMatchObject({ kind: 'syntax' });
  });
});
