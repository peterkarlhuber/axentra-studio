import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { usersApi } from '@/api/endpoints';
import type { User } from '@/api/models';
import { Button, Checkbox, Dialog, FormField, Input, layout } from '@/components/ui';
import { ProblemAlert } from '@/features/shared/ProblemAlert';
import { fieldErrors } from '@/lib/errors';
import { IdentityFields } from './IdentityFields';
import { useOidcIssuers } from './oidc-providers';

/**
 * Create a user who signs in through single sign-on (`POST /v1/users/external`, platform
 * administrators), with or without an email address: for migrations and imports. The email
 * becomes the user's address only when the provider verified it.
 */
export function ExternalUserDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (user: User) => void;
}) {
  const { t } = useTranslation('users');
  const queryClient = useQueryClient();
  const issuers = useOidcIssuers(open);
  const [provider, setProvider] = useState('');
  const [subject, setSubject] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [verified, setVerified] = useState(false);
  const create = useMutation({
    mutationFn: () =>
      usersApi.createExternal({
        provider: provider.trim(),
        subject: subject.trim(),
        name: name.trim(),
        email: email.trim() || null,
        email_verified: Boolean(email.trim()) && verified,
      }),
    onSuccess: (user) => {
      void queryClient.invalidateQueries({ queryKey: ['users', 'list'] });
      onCreated(user);
    },
  });
  // Closed (Cancel, discard, created): the next opening starts empty.
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (!open) {
      setProvider('');
      setSubject('');
      setName('');
      setEmail('');
      setVerified(false);
      create.reset();
    }
  }
  const errors = create.error ? fieldErrors(create.error) : {};

  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      dirty={Boolean(provider.trim() || subject.trim() || name.trim() || email.trim())}
      title={t('external.title')}
      description={t('external.description')}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            type="submit"
            form="external-user-form"
            variant="primary"
            loading={create.isPending}
            disabled={!provider.trim() || !subject.trim()}
          >
            {t('external.submit')}
          </Button>
        </>
      }
    >
      <form id="external-user-form" className={layout.form} onSubmit={submit}>
        <IdentityFields
          provider={provider}
          subject={subject}
          onProviderChange={setProvider}
          onSubjectChange={setSubject}
          issuers={issuers}
          errors={errors}
        />
        <FormField label={t('fields.name')} help={t('external.nameHelp')} error={errors.name}>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={200}
            autoComplete="off"
          />
        </FormField>
        <FormField
          label={t('external.email')}
          help={t('external.emailHelp')}
          info={t('external.emailInfo')}
          infoTopic="users#external-user"
          error={errors.email}
        >
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            maxLength={320}
            spellCheck={false}
            autoComplete="off"
          />
        </FormField>
        <Checkbox
          checked={verified && Boolean(email.trim())}
          disabled={!email.trim()}
          onCheckedChange={setVerified}
          label={t('external.verified')}
          description={t('external.verifiedHelp')}
        />
        <ProblemAlert error={create.error} />
      </form>
    </Dialog>
  );
}
