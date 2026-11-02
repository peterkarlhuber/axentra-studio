import { useTranslation } from 'react-i18next';
import type { NewInvitation } from '@/api/models';
import { Alert, CopyField, layout } from '@/components/ui';

/** The one-time accept link / token of a new invitation (returned only once). */
export function InvitationSecret({ invitation }: { invitation: NewInvitation }) {
  const { t } = useTranslation('tenants');
  return (
    <div className={layout.form}>
      <Alert tone="warning" title={t('invitations.oneTimeTitle')}>
        {t('invitations.oneTimeBody')}
      </Alert>
      {invitation.accept_url ? (
        <CopyField label={t('invitations.link')} value={invitation.accept_url} />
      ) : null}
      <CopyField label={t('invitations.token')} value={invitation.token} secret />
      {!invitation.accept_url ? <p className={layout.muted}>{t('invitations.tokenHelp')}</p> : null}
    </div>
  );
}
