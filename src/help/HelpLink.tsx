import type { MouseEvent, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useInRouterContext } from 'react-router';
import { BookOpen } from 'lucide-react';
import clsx from '@/lib/clsx';
import { HelpContext, helpHref } from './help-context';
import type { HelpTopic } from './manifest';
import { useContext } from 'react';
import styles from './help.module.css';

export interface HelpLinkProps {
  topic: HelpTopic;
  /** Link text; defaults to "Learn more". */
  children?: ReactNode;
  /** Show a small book icon before the text. */
  icon?: boolean;
  className?: string;
}

/**
 * Opens a help article in the side panel (the user stays on the page). It is a real link to
 * the help center, so middle click, "open in new tab" and no-JS fallbacks still work.
 */
export function HelpLink({ topic, children, icon = false, className }: HelpLinkProps) {
  const { t } = useTranslation('help');
  const help = useContext(HelpContext);
  const inRouter = useInRouterContext();
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!help || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    help.openHelp(topic);
  };
  const content = (
    <>
      {icon ? <BookOpen aria-hidden="true" className={styles.helpLinkIcon} /> : null}
      {children ?? t('tip.learnMore')}
    </>
  );
  if (!inRouter) {
    // Outside the router (startup screens, isolated component tests): a plain link.
    return (
      <a
        href={helpHref(topic)}
        className={clsx(styles.helpLink, className)}
        data-help-topic={topic}
      >
        {content}
      </a>
    );
  }
  return (
    <Link
      to={helpHref(topic)}
      onClick={onClick}
      className={clsx(styles.helpLink, className)}
      data-help-topic={topic}
    >
      {content}
    </Link>
  );
}
