import * as RadixDialog from '@radix-ui/react-dialog';
import { Suspense, lazy, useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { Skeleton } from '@/components/ui';
import { HelpContext, type HelpContextValue } from './help-context';
import type { HelpTopic } from './manifest';
import styles from './help.module.css';

// The panel content pulls in the help library and the Markdown renderer; load it on first use.
const HelpPanelContent = lazy(() => import('./HelpPanelContent'));

/**
 * Provides `useHelp()` and renders the help side panel. Contextual help opens articles here,
 * so users keep their form and page while reading.
 */
export function HelpProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<HelpTopic[]>([]);
  const { pathname } = useLocation();

  // The panel is opened programmatically, so Radix has no trigger to return focus to.
  const opener = useRef<HTMLElement | null>(null);
  const openHelp = useCallback((topic: HelpTopic) => {
    if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
      opener.current = document.activeElement;
    }
    setStack([topic]);
  }, []);
  const closeHelp = useCallback(() => setStack([]), []);
  const value = useMemo<HelpContextValue>(() => ({ openHelp, closeHelp }), [openHelp, closeHelp]);

  // Navigating to another page (for example through an app: link) closes the panel.
  const [panelPath, setPanelPath] = useState(pathname);
  if (panelPath !== pathname) {
    setPanelPath(pathname);
    if (stack.length) setStack([]);
  }

  const topic = stack[stack.length - 1];
  return (
    <HelpContext.Provider value={value}>
      {children}
      <RadixDialog.Root open={Boolean(topic)} onOpenChange={(open) => (open ? null : closeHelp())}>
        <RadixDialog.Portal>
          <RadixDialog.Overlay className={styles.panelOverlay} />
          <RadixDialog.Content
            className={styles.panel}
            aria-describedby={undefined}
            onCloseAutoFocus={(event) => {
              const target = opener.current;
              opener.current = null;
              if (target?.isConnected) {
                event.preventDefault();
                target.focus();
              }
            }}
          >
            {topic ? (
              <Suspense fallback={<PanelFallback />}>
                <HelpPanelContent
                  topic={topic}
                  canGoBack={stack.length > 1}
                  onBack={() => setStack((current) => current.slice(0, -1))}
                  onTopic={(next) => setStack((current) => [...current, next])}
                />
              </Suspense>
            ) : null}
          </RadixDialog.Content>
        </RadixDialog.Portal>
      </RadixDialog.Root>
    </HelpContext.Provider>
  );
}

/** Shown while the panel content loads; it keeps the dialog titled for assistive technology. */
function PanelFallback() {
  const { t } = useTranslation('help');
  return (
    <>
      <div className={styles.panelHeader}>
        <div className={styles.panelHeadings}>
          <RadixDialog.Title className={styles.panelTitle}>{t('panel.title')}</RadixDialog.Title>
        </div>
      </div>
      <div className={styles.panelBody}>
        <div className={styles.skeletons}>
          {[0, 1, 2, 3, 4].map((index) => (
            <Skeleton key={index} height={16} />
          ))}
        </div>
      </div>
    </>
  );
}
