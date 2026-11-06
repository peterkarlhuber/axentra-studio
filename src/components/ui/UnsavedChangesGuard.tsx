import { useContext, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { UNSAFE_DataRouterContext, useBlocker } from 'react-router';
import { ConfirmDialog } from './ConfirmDialog';

/**
 * Asks before unsaved input is lost. While `when` is true, a reload or closing the tab triggers
 * the browser's own "leave site?" prompt, and a navigation to another page inside Studio (a
 * link, the sidebar, signing out) asks first. Changes of the query string or the hash on the
 * same page (tabs, opening a dialog) are not blocked.
 *
 * Set `when` to false while a save runs, so a navigation after a successful save is not asked.
 */
export function UnsavedChangesGuard({ when }: { when: boolean }) {
  useEffect(() => {
    if (!when) return undefined;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Older browsers need returnValue set to show the prompt.
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [when]);

  // useBlocker needs a data router; component tests may render with a plain MemoryRouter.
  const dataRouter = useContext(UNSAFE_DataRouterContext);
  return dataRouter ? <NavigationGuard when={when} /> : null;
}

function NavigationGuard({ when }: { when: boolean }) {
  const { t } = useTranslation();
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      when && currentLocation.pathname !== nextLocation.pathname,
  );
  const leaving = useRef(false);
  useEffect(() => {
    if (blocker.state === 'unblocked') leaving.current = false;
  }, [blocker.state]);

  // The form went away or became clean while asking: let a held navigation go on.
  useEffect(() => {
    if (blocker.state === 'blocked' && !when) blocker.proceed();
  }, [blocker, when]);

  return (
    <ConfirmDialog
      open={blocker.state === 'blocked'}
      onOpenChange={(open) => {
        if (open || leaving.current) return;
        if (blocker.state === 'blocked') blocker.reset();
      }}
      title={t('unsaved.title')}
      description={t('unsaved.body')}
      confirmLabel={t('unsaved.leave')}
      onConfirm={() => {
        if (blocker.state !== 'blocked') return;
        leaving.current = true;
        blocker.proceed();
      }}
    />
  );
}
