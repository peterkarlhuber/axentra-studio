import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { FormField, Input } from '@/components/ui';
import type { OidcIssuer } from './oidc-providers';

/**
 * Provider (the issuer, as `oidc[].issuer` configures it) and subject (the provider's `sub`
 * claim) of an external identity. The configured issuers are offered as suggestions; any other
 * value is allowed, for example the issuer of a provider that is not configured yet.
 */
export function IdentityFields({
  provider,
  subject,
  onProviderChange,
  onSubjectChange,
  issuers,
  errors = {},
}: {
  provider: string;
  subject: string;
  onProviderChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  issuers: readonly OidcIssuer[];
  errors?: Record<string, string>;
}) {
  const { t } = useTranslation('users');
  const listId = `oidc-issuers-${useId()}`;
  return (
    <>
      <FormField
        label={t('identities.provider')}
        help={issuers.length > 0 ? t('identities.providerHelp') : t('identities.providerHelpFree')}
        info={t('identities.providerInfo')}
        infoTopic="users#identities"
        error={errors.provider}
        required
      >
        <Input
          value={provider}
          onChange={(event) => onProviderChange(event.target.value)}
          list={issuers.length > 0 ? listId : undefined}
          maxLength={500}
          spellCheck={false}
          autoComplete="off"
          placeholder="https://login.example.com"
        />
      </FormField>
      {issuers.length > 0 ? (
        <datalist id={listId}>
          {issuers.map((entry) => (
            <option key={entry.issuer} value={entry.issuer} label={entry.name} />
          ))}
        </datalist>
      ) : null}
      <FormField
        label={t('identities.subject')}
        help={t('identities.subjectHelp')}
        error={errors.subject}
        required
      >
        <Input
          value={subject}
          onChange={(event) => onSubjectChange(event.target.value)}
          maxLength={500}
          spellCheck={false}
          autoComplete="off"
        />
      </FormField>
    </>
  );
}
