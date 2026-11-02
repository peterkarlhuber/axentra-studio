import * as Popover from '@radix-ui/react-popover';
import { Info } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { HelpLink } from './HelpLink';
import type { HelpTopic } from './manifest';
import styles from './help.module.css';

export interface InfoTipProps {
  /** Accessible name of the (i) button, e.g. "About grace period". */
  label: string;
  /** The explanation (one to three sentences). */
  children: ReactNode;
  /** Optional article/section for "Learn more". */
  topic?: HelpTopic;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

/**
 * A toggletip: an (i) button that shows a short explanation on click, tap, Enter or Space and
 * closes on Escape or outside click. Unlike hover tooltips it works with touch and screen
 * readers, and the text can contain a link.
 */
export function InfoTip({ label, children, topic, side = 'top' }: InfoTipProps) {
  const { t } = useTranslation('help');
  return (
    <Popover.Root>
      <Popover.Trigger className={styles.infoButton} aria-label={label} data-info-tip>
        <Info aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className={styles.infoContent}
          side={side}
          sideOffset={6}
          collisionPadding={12}
          aria-label={label}
        >
          <div className={styles.infoText}>{children}</div>
          {topic ? (
            <p className={styles.infoMore}>
              <HelpLink topic={topic} icon>
                {t('tip.learnMore')}
              </HelpLink>
            </p>
          ) : null}
          <Popover.Arrow className={styles.infoArrow} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
