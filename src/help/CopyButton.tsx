import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@/components/ui';

/** Copy-to-clipboard button for code blocks; announces the result through a live region. */
export function CopyButton({ value, label }: { value: string; label?: string }) {
  const { t } = useTranslation('help');
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    if (status === 'idle') return;
    const timer = window.setTimeout(() => setStatus('idle'), 2000);
    return () => window.clearTimeout(timer);
  }, [status]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
  };

  return (
    <>
      <IconButton
        size="sm"
        label={label ?? t('article.copyCode')}
        icon={status === 'copied' ? <Check /> : <Copy />}
        onClick={() => void copy()}
      />
      <span className="ax-sr-only" role="status">
        {status === 'copied'
          ? t('article.copied')
          : status === 'failed'
            ? t('article.copyFailed')
            : ''}
      </span>
    </>
  );
}
