import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { useCan } from '@/app/auth';
import { useProductScope } from '@/app/contexts';
import { ButtonLink, PageHeader, Tabs, layout } from '@/components/ui';
import { MailboxPanel } from './MailboxPanel';
import { MessagesPanel } from './MessagesPanel';
import { PreferencesPanel } from './PreferencesPanel';
import { StatsCard } from './StatsCard';
import { TemplatesPanel } from './TemplatesPanel';

const TABS = ['templates', 'messages', 'mailbox', 'preferences'] as const;
type Tab = (typeof TABS)[number];

/**
 * Notifications of the current product: templates, the outbox (message log), the local
 * development mailbox and the signed-in user's own preferences. Everything except the
 * preferences needs `notify:manage`.
 */
export function NotificationsPage() {
  const { t } = useTranslation('notify');
  const { productId } = useProductScope();
  const can = useCan();
  const canManage = can('notify:manage');
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab') as Tab | null;
  const available: Tab[] = canManage ? [...TABS] : ['preferences'];
  const tab: Tab =
    requested && available.includes(requested) ? requested : (available[0] ?? 'preferences');

  return (
    <div className={layout.stack}>
      <PageHeader
        title={t('title')}
        description={canManage ? t('description') : t('descriptionPreferencesOnly')}
        help={canManage ? 'notifications' : 'notifications#preferences'}
        actions={
          canManage ? (
            <ButtonLink to="templates/new" variant="primary" icon={<Plus />}>
              {t('templates.create')}
            </ButtonLink>
          ) : null
        }
      />
      {canManage ? <StatsCard productId={productId} /> : null}
      <Tabs
        label={t('tabs.label')}
        value={tab}
        onValueChange={(value) => {
          const next = new URLSearchParams(params);
          next.set('tab', value);
          setParams(next, { replace: true });
        }}
        items={[
          {
            value: 'templates',
            label: t('tabs.templates'),
            hidden: !canManage,
            content: <TemplatesPanel productId={productId} />,
          },
          {
            value: 'messages',
            label: t('tabs.messages'),
            hidden: !canManage,
            content: <MessagesPanel productId={productId} />,
          },
          {
            value: 'mailbox',
            label: t('tabs.mailbox'),
            hidden: !canManage,
            content: <MailboxPanel productId={productId} />,
          },
          {
            value: 'preferences',
            label: t('tabs.preferences'),
            content: <PreferencesPanel productId={productId} />,
          },
        ]}
      />
    </div>
  );
}
