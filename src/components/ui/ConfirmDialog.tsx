import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { FormField } from './FormField';
import { Input } from './Input';
import styles from './ConfirmDialog.module.css';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel: string;
  tone?: 'danger' | 'primary';
  /** Require typing this exact text before the confirm button enables. */
  confirmText?: string;
  onConfirm: () => unknown;
  children?: ReactNode;
}

/**
 * Confirmation for destructive or irreversible actions. While `onConfirm` runs the button
 * shows a spinner; the dialog closes only on success (errors are reported by the caller).
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  tone = 'danger',
  confirmText,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const matches = !confirmText || typed.trim() === confirmText;

  const change = (next: boolean) => {
    if (busy) return;
    if (!next) setTyped('');
    onOpenChange(next);
  };

  const confirm = async () => {
    if (!matches) return;
    setBusy(true);
    try {
      await onConfirm();
      setTyped('');
      onOpenChange(false);
    } catch {
      // Caller shows the error (toast); keep the dialog open for another try.
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={change}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => change(false)} disabled={busy}>
            {t('actions.cancel')}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={confirm}
            loading={busy}
            disabled={!matches}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <form
        className={styles.body}
        onSubmit={(event) => {
          event.preventDefault();
          void confirm();
        }}
      >
        {children}
        {confirmText ? (
          <FormField
            label={t('confirm.typeToConfirm', { text: confirmText })}
            help={t('confirm.typeToConfirmHelp')}
          >
            <Input
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </FormField>
        ) : null}
      </form>
    </Dialog>
  );
}
