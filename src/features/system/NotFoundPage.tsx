import { SearchX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ButtonLink, EmptyState, PageHeader } from '@/components/ui';

export function NotFoundPage() {
  const { t } = useTranslation('system');
  return (
    <>
      <PageHeader title={t('notFound.title')} />
      <EmptyState
        icon={<SearchX />}
        title={t('notFound.heading')}
        description={t('notFound.body')}
        action={
          <ButtonLink to="/" variant="primary">
            {t('notFound.home')}
          </ButtonLink>
        }
      />
    </>
  );
}
