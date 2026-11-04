import * as RadixDialog from '@radix-ui/react-dialog';
import { CircleHelp, Menu, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet, useLocation, useParams } from 'react-router';
import { IconButton, Tooltip } from '@/components/ui';
import { readPreference, writePreference } from '@/lib/storage';
import { useAdoptServerPreferences } from '../preferences';
import { useLastProductId } from '../useLastProduct';
import { Breadcrumbs } from './Breadcrumbs';
import { ProductSwitcher } from './ProductSwitcher';
import { Sidebar } from './Sidebar';
import { UserMenu } from './UserMenu';
import styles from './AppShell.module.css';
import topbar from './Topbar.module.css';

export function AppShell() {
  const { t } = useTranslation('nav');
  const params = useParams();
  const { pathname } = useLocation();
  const lastProductId = useLastProductId();
  const productId = params.productId ?? lastProductId;
  const [collapsed, setCollapsed] = useState(() => readPreference('sidebarCollapsed') === '1');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  // The path the drawer was opened on: closing it there returns the focus to the menu button.
  const drawerOpenedOn = useRef<string | null>(null);

  useAdoptServerPreferences();

  // Close the mobile drawer whenever the route changes (state derived during render).
  const [drawerPath, setDrawerPath] = useState(pathname);
  if (drawerPath !== pathname) {
    setDrawerPath(pathname);
    setDrawerOpen(false);
  }

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      writePreference('sidebarCollapsed', value ? '0' : '1');
      return !value;
    });
  };

  return (
    <div className={styles.shell} data-collapsed={collapsed || undefined}>
      <a href="#main-content" className="ax-skip-link">
        {t('skipToContent')}
      </a>
      <aside className={styles.rail}>
        <Sidebar productId={productId} collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      </aside>

      <RadixDialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <RadixDialog.Portal>
          <RadixDialog.Overlay className={styles.drawerOverlay} />
          <RadixDialog.Content
            className={styles.drawer}
            aria-describedby={undefined}
            onCloseAutoFocus={(event) => {
              // The menu button is not a Radix trigger, so Radix would leave the focus on <body>.
              // After a navigation the route focus moves it to the new page's heading instead.
              event.preventDefault();
              const openedOn = drawerOpenedOn.current;
              drawerOpenedOn.current = null;
              if (openedOn === window.location.pathname) menuButton.current?.focus();
            }}
          >
            <RadixDialog.Title className="ax-sr-only">{t('main')}</RadixDialog.Title>
            <Sidebar
              productId={productId}
              collapsed={false}
              variant="drawer"
              onNavigate={() => setDrawerOpen(false)}
            />
            <RadixDialog.Close asChild>
              <IconButton
                className={styles.drawerClose}
                variant="onDark"
                label={t('closeMenu')}
                icon={<X />}
                showTooltip={false}
              />
            </RadixDialog.Close>
          </RadixDialog.Content>
        </RadixDialog.Portal>
      </RadixDialog.Root>

      <div className={styles.main}>
        <header className={topbar.topbar}>
          <IconButton
            className={topbar.menuButton}
            ref={menuButton}
            label={t('openMenu')}
            icon={<Menu />}
            onClick={() => {
              drawerOpenedOn.current = pathname;
              setDrawerOpen(true);
            }}
            aria-expanded={drawerOpen}
            showTooltip={false}
          />
          <div className={topbar.crumbs}>
            <Breadcrumbs />
          </div>
          <div className={topbar.actions}>
            <ProductSwitcher productId={productId} />
            <Tooltip content={t('help:center.open')}>
              <Link to="/help" className={topbar.helpButton} aria-label={t('help:center.open')}>
                <CircleHelp aria-hidden="true" />
              </Link>
            </Tooltip>
            <UserMenu />
          </div>
        </header>
        <main id="main-content" className={styles.content} tabIndex={-1}>
          <div className={styles.inner}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
