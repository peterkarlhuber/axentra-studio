import { Boxes, ChevronsUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';
import { useMeta } from '../contexts';
import { useSwitchableProducts } from '../useProducts';
import { switchProductPath } from './shell-utils';
import styles from './Topbar.module.css';

export function ProductSwitcher({ productId }: { productId: string | null }) {
  const { t } = useTranslation('nav');
  const meta = useMeta();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { products } = useSwitchableProducts();

  // Single-product mode serves exactly one product (docs/architecture/DEPLOYMENT_MODELS.md in
  // Axentra): no switcher, only a static label naming it.
  if (meta.mode === 'single') {
    const name = meta.product?.name;
    if (!name) return null;
    return (
      <span className={styles.productLabel} data-testid="single-product-label">
        <Boxes aria-hidden className={styles.switcherIcon} />
        <span className={styles.switcherText}>
          <span className={styles.switcherLabel}>{t('product')}</span>
          <span className={styles.switcherValue}>{name}</span>
        </span>
      </span>
    );
  }

  const current = products.find((product) => product.id === productId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={styles.switcher}>
        <Boxes aria-hidden className={styles.switcherIcon} />
        <span className={styles.switcherText}>
          <span className={styles.switcherLabel}>{t('product')}</span>
          <span className={styles.switcherValue}>{current?.name ?? t('noProduct')}</span>
        </span>
        {/* Visible text first, so the accessible name contains the visible label (WCAG 2.5.3). */}
        <span className="ax-sr-only"> {t('switchProduct')}</span>
        <ChevronsUpDown aria-hidden className={styles.chevron} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t('products')}</DropdownMenuLabel>
        {products.length > 0 ? (
          <DropdownMenuRadioGroup
            label={t('products')}
            value={productId ?? ''}
            onValueChange={(id) => void navigate(switchProductPath(pathname, id))}
          >
            {products.map((product) => (
              <DropdownMenuRadioItem key={product.id} value={product.id}>
                {product.name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        ) : (
          <DropdownMenuItem disabled>{t('noProducts')}</DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem icon={<Boxes />} onSelect={() => void navigate('/products')}>
          {t('allProducts')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
