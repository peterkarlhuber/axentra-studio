import { Check, Copy, Eye, EyeOff } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from '@/lib/clsx';
import { IconButton } from './IconButton';
import styles from './CopyField.module.css';

export interface CopyFieldProps {
  value: string;
  label: string;
  /** Mask the value until revealed (one-time secrets). */
  secret?: boolean;
  hideLabel?: boolean;
}

async function writeClipboard(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export function CopyField({ value, label, secret = false, hideLabel }: CopyFieldProps) {
  const { t } = useTranslation();
  const id = useId();
  const [revealed, setRevealed] = useState(!secret);
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    if (status === 'idle') return;
    const timer = window.setTimeout(() => setStatus('idle'), 2500);
    return () => window.clearTimeout(timer);
  }, [status]);

  const copy = async () => setStatus((await writeClipboard(value)) ? 'copied' : 'failed');

  return (
    <div className={styles.wrapper}>
      <label htmlFor={id} className={clsx(styles.label, hideLabel && 'ax-sr-only')}>
        {label}
      </label>
      <div className={styles.field}>
        <input
          id={id}
          className={styles.input}
          readOnly
          type={revealed ? 'text' : 'password'}
          value={value}
          spellCheck={false}
          autoComplete="off"
          onFocus={(event) => event.currentTarget.select()}
        />
        {secret ? (
          <IconButton
            size="sm"
            label={revealed ? t('copy.hide') : t('copy.reveal')}
            icon={revealed ? <EyeOff /> : <Eye />}
            onClick={() => setRevealed((value) => !value)}
          />
        ) : null}
        <IconButton
          size="sm"
          label={status === 'copied' ? t('copy.copied') : t('copy.copy')}
          icon={status === 'copied' ? <Check /> : <Copy />}
          onClick={copy}
        />
      </div>
      <p className={styles.status} role="status" aria-live="polite">
        {status === 'copied' ? t('copy.copied') : status === 'failed' ? t('copy.failed') : ''}
      </p>
    </div>
  );
}
