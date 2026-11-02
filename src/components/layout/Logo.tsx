import clsx from '@/lib/clsx';
import styles from './Logo.module.css';

/** Served brand files, derived from branding-src/ by scripts/derive_branding.py. */
const LOCKUP_LIGHT = '/branding/axentra-logo-transparent.png';
const LOCKUP_ON_DARK = '/branding/axentra-logo-on-dark.png';
const MARK = '/branding/axentra-mark.png';
const MARK_SMALL = '/branding/axentra-mark-128.png';
/** Intrinsic size of the derived lockups (960 x 238). */
const LOCKUP_RATIO = 960 / 238;

/**
 * The one place that picks an Axentra logo file.
 *
 * - `lockup` (symbol + wordmark) with `surface="theme"` follows the app theme: black wordmark in
 *   the light theme, white wordmark in the dark theme (`data-theme` on <html>).
 * - `lockup` with `surface="dark"` always uses the white wordmark (navy sidebar in both themes).
 * - `mark` is the symbol alone, the same file on every surface; use it below ~40 px height.
 *
 * Pass `alt=""` when visible text next to the logo already names the product.
 */
export function Logo({
  variant = 'lockup',
  surface = 'theme',
  height,
  alt,
  className,
}: {
  variant?: 'lockup' | 'mark';
  surface?: 'theme' | 'dark';
  height: number;
  alt: string;
  className?: string;
}) {
  if (variant === 'mark') {
    const src = height <= 64 ? MARK_SMALL : MARK;
    return <img src={src} alt={alt} width={height} height={height} className={className} />;
  }
  const width = Math.round(height * LOCKUP_RATIO);
  if (surface === 'dark') {
    return (
      <img src={LOCKUP_ON_DARK} alt={alt} width={width} height={height} className={className} />
    );
  }
  return (
    <span className={clsx(styles.themed, className)}>
      <img src={LOCKUP_LIGHT} alt={alt} width={width} height={height} className={styles.light} />
      <img src={LOCKUP_ON_DARK} alt={alt} width={width} height={height} className={styles.dark} />
    </span>
  );
}
