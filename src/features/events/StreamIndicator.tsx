import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';
import { InfoTip } from '@/help/InfoTip';
import { describeError } from '@/lib/errors';
import clsx from '@/lib/clsx';
import type { EventStreamState } from './useEventStream';
import styles from './events.module.css';

/**
 * Connection state of an SSE stream, announced politely. Only claims "live" while the HTTP
 * response is actually open; "reconnecting" shows the delay, "closed" the reason.
 */
export function StreamIndicator({
  stream,
  paused = false,
}: {
  stream: EventStreamState;
  paused?: boolean;
}) {
  const { t } = useTranslation('events');
  const { status, retryMs, closeReason } = stream;
  const state = paused && status === 'open' ? 'paused' : status;
  let reason: string | null = null;
  if (status === 'closed' && closeReason) {
    if (closeReason.error) {
      reason = describeError(t, closeReason.error).title;
    } else if (closeReason.kind === 'access') {
      reason = t('stream.accessLost');
    }
    if (closeReason.detail) reason = `${reason ?? ''} ${closeReason.detail}`.trim();
  }
  return (
    <div className={styles.streamBar}>
      <span className={clsx(styles.streamState, styles[`stream_${state}`])} role="status">
        <span className={styles.streamDot} aria-hidden="true" />
        {t(`stream.${state}`)}
        {status === 'reconnecting' && retryMs
          ? ` · ${t('stream.retryIn', { seconds: Math.ceil(retryMs / 1000) })}`
          : null}
        {reason ? ` · ${reason}` : null}
      </span>
      <InfoTip label={t('stream.infoLabel')} topic="events#connection-status">
        {t('stream.info')}
      </InfoTip>
      {status === 'closed' ? (
        <Button size="sm" icon={<RefreshCw />} onClick={stream.reconnect}>
          {t('stream.reconnect')}
        </Button>
      ) : null}
    </div>
  );
}
