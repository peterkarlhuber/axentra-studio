import {
  ArrowDown,
  ArrowRight,
  Clock,
  Database,
  HardDrive,
  KeyRound,
  Monitor,
  Send,
  Server,
  Workflow,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from '@/lib/clsx';
import styles from './diagrams.module.css';

/**
 * Diagrams for help articles, written as HTML/CSS instead of images: text wraps in every
 * language, follows the theme, scales with zoom and is read by screen readers in order.
 * Labels live in `help:diagrams.<name>.*`. Every state and arrow is checked against the
 * backend (see docs/HELP_AUTHORING.md).
 */
function Figure({ name, children }: { name: string; children: ReactNode }) {
  const { t } = useTranslation('help');
  return (
    <figure
      className={styles.figure}
      aria-label={t('article.diagram', { title: t(`diagrams.${name}.title`) })}
    >
      {children}
      <figcaption className={styles.caption}>{t(`diagrams.${name}.caption`)}</figcaption>
    </figure>
  );
}

function Box({
  icon,
  title,
  detail,
  tone = 'neutral',
  className,
}: {
  icon?: ReactNode;
  title: string;
  detail?: string;
  tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'muted';
  className?: string;
}) {
  return (
    <div className={clsx(styles.box, styles[tone], className)}>
      {icon ? (
        <span className={styles.boxIcon} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className={styles.boxText}>
        <strong>{title}</strong>
        {detail ? <span className={styles.detail}>{detail}</span> : null}
      </span>
    </div>
  );
}

function Arrow({ label, direction = 'down' }: { label?: string; direction?: 'down' | 'right' }) {
  return (
    <div className={clsx(styles.arrow, styles[direction])}>
      <span aria-hidden="true">{direction === 'down' ? <ArrowDown /> : <ArrowRight />}</span>
      {label ? <span className={styles.arrowLabel}>{label}</span> : null}
    </div>
  );
}

export function ArchitectureDiagram() {
  const { t } = useTranslation('help', { keyPrefix: 'diagrams.architecture' });
  return (
    <Figure name="architecture">
      <div className={styles.row}>
        <Box icon={<Monitor />} title={t('studio')} detail={t('studioDetail')} />
        <Box icon={<Workflow />} title={t('app')} detail={t('appDetail')} />
      </div>
      <Arrow label={t('http')} />
      <Box
        icon={<Server />}
        title={t('server')}
        detail={t('serverDetail')}
        tone="brand"
        className={styles.wide}
      />
      <Arrow />
      <div className={styles.row}>
        <Box icon={<Database />} title={t('database')} detail={t('databaseDetail')} />
        <Box icon={<HardDrive />} title={t('files')} detail={t('filesDetail')} />
        <Box icon={<Send />} title={t('outbound')} detail={t('outboundDetail')} />
      </div>
    </Figure>
  );
}

export function HierarchyDiagram() {
  const { t } = useTranslation('help', { keyPrefix: 'diagrams.hierarchy' });
  return (
    <Figure name="hierarchy">
      <Box
        title={t('platform')}
        detail={t('platformDetail')}
        tone="brand"
        className={styles.wide}
      />
      <Arrow label={t('contains')} />
      <div className={styles.row}>
        <div className={styles.column}>
          <Box title={t('product')} detail={t('productDetail')} />
          <Arrow label={t('contains')} />
          <div className={styles.row}>
            <Box title={t('tenant')} detail={t('tenantDetail')} tone="success" />
            <Box title={t('tenant2')} detail={t('tenantDetail')} tone="success" />
          </div>
        </div>
        <div className={styles.column}>
          <Box title={t('product2')} detail={t('productDetail')} tone="muted" />
        </div>
      </div>
      <p className={styles.note}>{t('users')}</p>
    </Figure>
  );
}

export function JobLifecycleDiagram() {
  const { t } = useTranslation('help', { keyPrefix: 'diagrams.jobLifecycle' });
  const { t: status } = useTranslation('events', { keyPrefix: 'jobStatus' });
  return (
    <Figure name="jobLifecycle">
      <div className={styles.flow}>
        <Box title={status('queued')} detail={t('queuedDetail')} />
        <Arrow direction="right" label={t('picked')} />
        <Box title={status('running')} detail={t('runningDetail')} tone="brand" />
        <Arrow direction="right" label={t('ok')} />
        <Box title={status('succeeded')} tone="success" />
      </div>
      <ul className={styles.outcomes}>
        <li>
          <Box
            title={t('retry', { status: status('queued') })}
            detail={t('retryDetail')}
            tone="warning"
          />
        </li>
        <li>
          <Box title={status('dead')} detail={t('deadDetail')} tone="danger" />
        </li>
        <li>
          <Box title={status('failed')} detail={t('failedDetail')} tone="danger" />
        </li>
        <li>
          <Box title={status('cancelled')} detail={t('cancelledDetail')} tone="muted" />
        </li>
      </ul>
      <p className={styles.note}>{t('manualRetry')}</p>
    </Figure>
  );
}

export function WebhookDeliveryDiagram() {
  const { t } = useTranslation('help', { keyPrefix: 'diagrams.webhookDelivery' });
  const { t: status } = useTranslation('events', { keyPrefix: 'deliveryStatus' });
  return (
    <Figure name="webhookDelivery">
      <div className={styles.flow}>
        <Box title={t('event')} detail={t('eventDetail')} />
        <Arrow direction="right" label={t('match')} />
        <Box title={status('pending')} detail={t('pendingDetail')} />
        <Arrow direction="right" label={t('post')} />
        <Box title={t('receiver')} detail={t('receiverDetail')} tone="brand" />
      </div>
      <ul className={styles.outcomes}>
        <li>
          <Box title={status('succeeded')} detail={t('succeededDetail')} tone="success" />
        </li>
        <li>
          <Box title={status('failed')} detail={t('failedDetail')} tone="warning" />
        </li>
        <li>
          <Box title={status('dead')} detail={t('deadDetail')} tone="danger" />
        </li>
      </ul>
      <p className={styles.note}>{t('redeliver')}</p>
    </Figure>
  );
}

export function KeyRotationDiagram() {
  const { t } = useTranslation('help', { keyPrefix: 'diagrams.keyRotation' });
  return (
    <Figure name="keyRotation">
      <div className={styles.timeline}>
        <div className={styles.lane}>
          <span className={styles.laneLabel}>
            <KeyRound aria-hidden="true" />
            {t('oldSecret')}
          </span>
          <div className={styles.bars}>
            <span className={clsx(styles.bar, styles.barActive)}>{t('valid')}</span>
            <span className={clsx(styles.bar, styles.barGrace)}>{t('grace')}</span>
            <span className={clsx(styles.bar, styles.barOff)}>{t('invalid')}</span>
          </div>
        </div>
        <div className={styles.lane}>
          <span className={styles.laneLabel}>
            <KeyRound aria-hidden="true" />
            {t('newSecret')}
          </span>
          <div className={styles.bars}>
            <span className={clsx(styles.bar, styles.barNone)} aria-hidden="true" />
            <span className={clsx(styles.bar, styles.barActive)}>{t('valid')}</span>
            <span className={clsx(styles.bar, styles.barActive)}>{t('valid')}</span>
          </div>
        </div>
        <div className={styles.axis}>
          <span />
          <div className={styles.bars}>
            <span />
            <span>
              <Clock aria-hidden="true" />
              {t('rotate')}
            </span>
            <span>
              <Clock aria-hidden="true" />
              {t('graceEnd')}
            </span>
          </div>
        </div>
      </div>
    </Figure>
  );
}
