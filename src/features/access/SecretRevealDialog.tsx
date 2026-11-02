import { ShieldAlert } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Checkbox, CopyField, Dialog } from '@/components/ui';
import styles from './access.module.css';

/**
 * One-time secret display. Cannot be dismissed by Escape/outside click; closing requires
 * confirming the secret was stored, because it can never be shown again.
 */
export function SecretRevealDialog({
  secret,
  keyName,
  onClose,
  title,
  secretLabel,
  children,
}: {
  secret: string | null;
  keyName: string;
  onClose: () => void;
  /** Overrides for other one-time secrets (e.g. webhook signing secrets). */
  title?: string;
  secretLabel?: string;
  children?: ReactNode;
}) {
  const { t } = useTranslation('access');
  const [stored, setStored] = useState(false);
  const close = () => {
    setStored(false);
    onClose();
  };
  return (
    <Dialog
      open={secret !== null}
      onOpenChange={(open) => (open ? undefined : stored ? close() : undefined)}
      dismissible={false}
      title={title ?? t('keys.secretTitle', { name: keyName })}
      footer={
        <Button variant="primary" disabled={!stored} onClick={close}>
          {t('common:actions.done')}
        </Button>
      }
    >
      <div className={styles.secretBox}>
        <Alert tone="warning" title={t('keys.secretWarningTitle')}>
          {t('keys.secretWarningBody')}
        </Alert>
        {secret ? (
          <CopyField label={secretLabel ?? t('keys.secret')} value={secret} secret />
        ) : null}
        {children}
        <Checkbox
          checked={stored}
          onCheckedChange={setStored}
          label={
            <>
              <ShieldAlert
                aria-hidden
                width={14}
                height={14}
                style={{ display: 'inline', verticalAlign: '-2px' }}
              />{' '}
              {t('keys.secretConfirm')}
            </>
          }
        />
      </div>
    </Dialog>
  );
}
