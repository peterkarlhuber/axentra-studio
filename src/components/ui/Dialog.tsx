import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from '@/lib/clsx';
import { Button } from './Button';
import { IconButton } from './IconButton';
import styles from './Dialog.module.css';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Render as a side drawer instead of a centered dialog. */
  variant?: 'dialog' | 'drawer';
  /** Prevent closing by outside click / Escape (e.g. while a secret is shown). */
  dismissible?: boolean;
  /**
   * The dialog holds unsaved input: closing it by Escape, an outside click or the close button
   * asks **Discard your changes?** first. A **Cancel** button of the caller that calls
   * `onOpenChange(false)` itself discards without asking (that is what Cancel means).
   */
  dirty?: boolean;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  variant = 'dialog',
  dismissible = true,
  dirty = false,
}: DialogProps) {
  const { t } = useTranslation();
  const [asking, setAsking] = useState(false);
  // Many dialogs open from a URL parameter (?new=1), not from a Radix trigger. Remember what had the
  // focus when the dialog opened, so closing it hands the focus back there (keyboard users would
  // otherwise land on the page body).
  const opener = useRef<HTMLElement | null>(null);
  const block = (event: Event) => {
    if (!dismissible) event.preventDefault();
  };
  const change = (next: boolean) => {
    if (!next && dirty) {
      setAsking(true);
      return;
    }
    onOpenChange(next);
  };
  return (
    <RadixDialog.Root open={open} onOpenChange={change}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={styles.overlay} />
        <RadixDialog.Content
          className={clsx(styles.content, styles[variant], variant === 'dialog' && styles[size])}
          onPointerDownOutside={block}
          onEscapeKeyDown={block}
          onOpenAutoFocus={() => {
            const active = document.activeElement;
            opener.current =
              active instanceof HTMLElement && active !== document.body ? active : null;
          }}
          onCloseAutoFocus={(event) => {
            const target = opener.current;
            opener.current = null;
            if (target?.isConnected && target !== document.body) {
              event.preventDefault();
              target.focus();
            }
          }}
          {...(description ? {} : { 'aria-describedby': undefined })}
        >
          <div className={styles.header}>
            <div className={styles.headings}>
              <RadixDialog.Title className={styles.title}>{title}</RadixDialog.Title>
              {description ? (
                <RadixDialog.Description className={styles.description}>
                  {description}
                </RadixDialog.Description>
              ) : null}
            </div>
            {dismissible ? (
              <RadixDialog.Close asChild>
                <IconButton label={t('actions.close')} icon={<X />} showTooltip={false} />
              </RadixDialog.Close>
            ) : null}
          </div>
          {children ? <div className={styles.body}>{children}</div> : null}
          {footer ? <div className={styles.footer}>{footer}</div> : null}
          {dirty ? (
            <Dialog
              open={asking}
              onOpenChange={setAsking}
              size="sm"
              title={t('discard.title')}
              description={t('discard.body')}
              footer={
                <>
                  <Button variant="ghost" onClick={() => setAsking(false)}>
                    {t('discard.keep')}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      setAsking(false);
                      onOpenChange(false);
                    }}
                  >
                    {t('discard.confirm')}
                  </Button>
                </>
              }
            />
          ) : null}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export const DialogClose = RadixDialog.Close;
