import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink } from 'react-router';
import { IconButton, Tooltip } from '@/components/ui';
import { useInboxUnread } from '@/features/notify/useInboxUnread';
import clsx from '@/lib/clsx';
import { useMe } from '../auth';
import { useMeta } from '../contexts';
import { isModuleEnabled } from '../modules';
import { NAVIGATION, type NavItem } from '../navigation';
import { Brand } from './Brand';
import styles from './Sidebar.module.css';

export interface SidebarProps {
  productId: string | null;
  collapsed: boolean;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
  /** Rendered inside the mobile drawer (no collapse control). */
  variant?: 'rail' | 'drawer';
}

export function Sidebar({
  productId,
  collapsed,
  onToggleCollapsed,
  onNavigate,
  variant = 'rail',
}: SidebarProps) {
  const { t } = useTranslation('nav');
  const meta = useMeta();
  const { data: me } = useMe();
  const isCollapsed = variant === 'rail' && collapsed;
  const inbox = useInboxUnread(productId);
  const badgeCount = (item: NavItem) =>
    item.badge === 'inboxUnread' ? (inbox.data?.unread ?? 0) : 0;

  // Items for disabled modules stay visible (they explain what to enable); items whose screen
  // the user cannot use at all are hidden once `/v1/me` is known. A direct visit still shows
  // the explanatory "Not permitted" state, and the server stays authoritative.
  const visible = (item: NavItem) =>
    (item.scope === 'platform' || Boolean(productId)) &&
    (!item.visibleTo || !me || item.visibleTo(me));

  return (
    <div className={clsx(styles.sidebar, isCollapsed && styles.collapsed)}>
      <div className={styles.brandRow}>
        <Link
          to="/"
          className={styles.brandLink}
          onClick={onNavigate}
          aria-label={t('common:app.home')}
        >
          <Brand collapsed={isCollapsed} compact={variant === 'drawer'} />
        </Link>
      </div>
      <div className={styles.accent} aria-hidden="true" />
      <nav aria-label={t('main')} className={styles.nav}>
        {NAVIGATION.map((group) => {
          const items = group.items.filter(visible);
          if (items.length === 0) return null;
          const headingId = `nav-group-${group.id}`;
          return (
            <div key={group.id} className={styles.group}>
              {group.labelKey ? (
                <h2 id={headingId} className={styles.groupLabel}>
                  {t(group.labelKey)}
                </h2>
              ) : null}
              <ul className={styles.list} aria-labelledby={group.labelKey ? headingId : undefined}>
                {items.map((item) => {
                  const off = item.module ? !isModuleEnabled(meta.modules, item.module) : false;
                  const count = off ? 0 : badgeCount(item);
                  const countText = count > 0 ? t('unreadCount', { count }) : '';
                  // "Inbox 3 unread": starts with the visible text ("Inbox", badge "3"), WCAG 2.5.3.
                  const label = countText ? `${t(item.labelKey)} ${countText}` : t(item.labelKey);
                  const link = (
                    <NavLink
                      to={item.to(productId ?? '')}
                      onClick={onNavigate}
                      className={({ isActive }) => clsx(styles.link, isActive && styles.active)}
                      aria-label={
                        isCollapsed
                          ? off
                            ? `${label} (${t('moduleOff')})`
                            : label
                          : countText
                            ? label
                            : undefined
                      }
                    >
                      <item.icon className={styles.icon} aria-hidden />
                      <span className={styles.label}>{t(item.labelKey)}</span>
                      {count > 0 ? (
                        // The link's aria-label carries the count in words.
                        <span className={styles.badge} aria-hidden="true">
                          {count}
                        </span>
                      ) : null}
                      {off ? (
                        <span className={styles.off}>
                          <span aria-hidden="true">{t('off')}</span>
                          <span className="ax-sr-only">({t('moduleOff')})</span>
                        </span>
                      ) : null}
                    </NavLink>
                  );
                  return (
                    <li key={item.id}>
                      {isCollapsed ? (
                        <Tooltip
                          content={off ? `${label} · ${t('moduleOff')}` : label}
                          side="right"
                        >
                          {link}
                        </Tooltip>
                      ) : (
                        link
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
      <div className={styles.footer}>
        {!isCollapsed ? (
          <p className={styles.version}>
            {meta.name} {meta.version}
          </p>
        ) : null}
        {variant === 'rail' && onToggleCollapsed ? (
          <IconButton
            variant="onDark"
            label={collapsed ? t('expand') : t('collapse')}
            icon={collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            onClick={onToggleCollapsed}
            aria-expanded={!collapsed}
          />
        ) : null}
      </div>
    </div>
  );
}
