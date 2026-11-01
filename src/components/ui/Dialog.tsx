import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from '@/lib/clsx';
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
}: DialogProps) {
  const { t } = useTranslation();
  const block = (event: Event) => {
    if (!dismissible) event.preventDefault();
  };
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={styles.overlay} />
        <RadixDialog.Content
          className={clsx(styles.content, styles[variant], variant === 'dialog' && styles[size])}
          onPointerDownOutside={block}
          onEscapeKeyDown={block}
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
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export const DialogClose = RadixDialog.Close;
