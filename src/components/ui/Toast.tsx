import * as RadixToast from '@radix-ui/react-toast';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from '@/lib/clsx';
import { ToastContext, type ToastApi, type ToastInput } from './toast-context';
import styles from './Toast.module.css';

interface ToastItem extends ToastInput {
  id: number;
  open: boolean;
}

let nextId = 1;

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

/**
 * Toasts are announced via aria-live by Radix: errors use the assertive "foreground" type,
 * everything else polite "background".
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((toast: ToastInput) => {
    const id = nextId++;
    setToasts((current) => [...current.slice(-3), { ...toast, id, open: true }]);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (title, description) => show({ title, description, tone: 'success' }),
      error: (title, description, meta) => show({ title, description, meta, tone: 'error' }),
      info: (title, description) => show({ title, description, tone: 'info' }),
    }),
    [show],
  );

  const close = (id: number) =>
    setToasts((current) =>
      current.map((item) => (item.id === id ? { ...item, open: false } : item)),
    );
  const remove = (id: number) => setToasts((current) => current.filter((item) => item.id !== id));

  return (
    <ToastContext.Provider value={api}>
      <RadixToast.Provider swipeDirection="right" label={t('toast.label')}>
        {children}
        {toasts.map((toast) => {
          const tone = toast.tone ?? 'info';
          const Icon = ICONS[tone];
          return (
            <RadixToast.Root
              key={toast.id}
              open={toast.open}
              type={tone === 'error' ? 'foreground' : 'background'}
              duration={tone === 'error' ? 9000 : 5000}
              className={clsx(styles.toast, styles[tone])}
              onOpenChange={(open) => (open ? undefined : close(toast.id))}
              onAnimationEnd={() => (toast.open ? undefined : remove(toast.id))}
            >
              <Icon className={styles.icon} aria-hidden />
              <div className={styles.text}>
                <RadixToast.Title className={styles.title}>{toast.title}</RadixToast.Title>
                {toast.description ? (
                  <RadixToast.Description className={styles.description}>
                    {toast.description}
                  </RadixToast.Description>
                ) : null}
                {toast.meta ? <p className={styles.meta}>{toast.meta}</p> : null}
              </div>
              <RadixToast.Close className={styles.close} aria-label={t('actions.dismiss')}>
                <X aria-hidden />
              </RadixToast.Close>
            </RadixToast.Root>
          );
        })}
        <RadixToast.Viewport className={styles.viewport} label={t('toast.region')} />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}
