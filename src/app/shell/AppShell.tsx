import * as RadixDialog from '@radix-ui/react-dialog';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useParams } from 'react-router';
import { IconButton } from '@/components/ui';
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
          <RadixDialog.Content className={styles.drawer} aria-describedby={undefined}>
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
            label={t('openMenu')}
            icon={<Menu />}
            onClick={() => setDrawerOpen(true)}
            aria-expanded={drawerOpen}
            showTooltip={false}
          />
          <div className={topbar.crumbs}>
            <Breadcrumbs />
          </div>
          <div className={topbar.actions}>
            <ProductSwitcher productId={productId} />
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
