import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  captureInvitationFromAddressBar,
  invitationTokenFromPath,
  isInvitationPath,
  normalizePathname,
  readPendingInvitation,
  ssoReturnPath,
  takeInvitationToken,
  withoutInvitationToken,
  writePendingInvitation,
} from './invitationLink';

const TOKEN = 'axinv_secret/+token';
const enc = encodeURIComponent(TOKEN);

beforeEach(() => {
  window.sessionStorage.clear();
  window.history.replaceState(null, '', '/');
});
afterEach(() => window.history.replaceState(null, '', '/'));

describe('invitation paths are matched after normalization (NF-2)', () => {
  it.each([
    '/invitations/accept',
    '/invitations/accept/',
    '/INVITATIONS/Accept',
    '/invitations//accept',
    '//invitations/accept//',
    '/invitations/%61ccept',
    '/invitations%2Faccept',
    '/invitations/%2561ccept',
    '/accept-invitation',
    '/Accept-Invitation/',
  ])('%s is an invitation path', (path) => {
    expect(isInvitationPath(path)).toBe(true);
    expect(invitationTokenFromPath(`${path}?token=${enc}`)).toBe(TOKEN);
    expect(withoutInvitationToken(`${path}?a=1&token=${enc}#h`)).toBe('/invitations/accept?a=1#h');
  });

  it.each(['/invitations', '/invitations/accepted', '/audit', '/p/x/invitations/accept'])(
    '%s is not',
    (path) => {
      expect(isInvitationPath(path)).toBe(false);
      expect(invitationTokenFromPath(`${path}?token=x`)).toBeNull();
      expect(withoutInvitationToken(`${path}?token=x`)).toBe(`${path}?token=x`);
    },
  );

  it('finds the token under any casing or encoding of its name, also repeated', () => {
    expect(invitationTokenFromPath(`/invitations/accept?TOKEN=${enc}`)).toBe(TOKEN);
    expect(invitationTokenFromPath(`/invitations/accept?%74oken=${enc}`)).toBe(TOKEN);
    expect(invitationTokenFromPath(`/invitations/accept?invitation=${enc}`)).toBe(TOKEN);
    expect(withoutInvitationToken(`/invitations/accept?token=a&Token=b&x=1`)).toBe(
      '/invitations/accept?x=1',
    );
    expect(normalizePathname('/%E0%A4%A')).toBe('/%e0%a4%a'); // malformed stays as it is
  });

  it('never puts a token-like parameter into a single sign-on return_to', () => {
    expect(ssoReturnPath(`/INVITATIONS/accept/?token=${enc}&lang=de#x`)).toBe(
      '/invitations/accept?lang=de#x',
    );
    expect(ssoReturnPath('/audit?token=t&id_token=u&tab=2')).toBe('/audit?tab=2');
    expect(ssoReturnPath('/audit?tab=2')).toBe('/audit?tab=2');
  });
});

describe('the token leaves the address bar (NF-3)', () => {
  it.each([
    `/invitations/accept?token=${enc}`,
    `/invitations/accept/?token=${enc}`,
    `/INVITATIONS/accept?token=${enc}`,
    `/invitations//accept?token=${enc}`,
    `/accept-invitation?token=${enc}`,
  ])('an invitation link %s is replaced at startup', (link) => {
    window.history.replaceState(null, '', `${link}&lang=de#top`);
    const length = window.history.length;
    expect(captureInvitationFromAddressBar()).toBe(true);
    expect(`${window.location.pathname}${window.location.search}${window.location.hash}`).toBe(
      '/invitations/accept?lang=de#top',
    );
    expect(window.location.href).not.toContain('axinv');
    expect(window.history.length).toBe(length); // replaced, no new history entry
    expect(readPendingInvitation()).toBe(TOKEN);
  });

  it('a sign-in page whose return_to holds an invitation link is replaced at startup', () => {
    const back = `/invitations/accept/?token=${enc}`;
    window.history.replaceState(
      null,
      '',
      `/login?login_error=access_denied&return_to=${encodeURIComponent(back)}`,
    );
    expect(captureInvitationFromAddressBar()).toBe(true);
    const params = new URLSearchParams(window.location.search);
    expect(params.get('return_to')).toBe('/invitations/accept');
    expect(params.get('login_error')).toBe('access_denied');
    expect(window.location.href).not.toContain('axinv');
    expect(readPendingInvitation()).toBe(TOKEN);
  });

  it('leaves other addresses alone', () => {
    for (const path of [
      '/',
      '/audit?token=x',
      '/login?return_to=%2Faudit',
      '/invitations/accept',
    ]) {
      window.history.replaceState(null, '', path);
      expect(captureInvitationFromAddressBar()).toBe(false);
      expect(`${window.location.pathname}${window.location.search}`).toBe(path);
    }
    expect(readPendingInvitation()).toBeNull();
  });

  it('keeps the token in memory when sessionStorage is unavailable', () => {
    const storage = vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(takeInvitationToken(`/invitations/accept?token=${enc}`)).toBe('/invitations/accept');
    expect(readPendingInvitation()).toBe(TOKEN);
    writePendingInvitation(null);
    expect(readPendingInvitation()).toBeNull();
    storage.mockRestore();
  });
});
