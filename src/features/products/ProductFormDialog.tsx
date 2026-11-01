import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Dialog, FormField, Input, Textarea, layout } from '@/components/ui';
import { fieldErrors } from '@/lib/errors';
import { slugify } from '@/lib/slug';

export interface ProductFormValues {
  name: string;
  slug: string;
  description: string;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  onSubmit,
  submitting,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ProductFormValues) => void;
  submitting: boolean;
  error: unknown;
}) {
  const { t } = useTranslation('products');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState('');
  const fields = error ? fieldErrors(error) : {};
  const effectiveSlug = slugTouched ? slug : slugify(name);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({ name: name.trim(), slug: effectiveSlug.trim(), description: description.trim() });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('create.title')}
      description={t('create.description')}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            type="submit"
            form="product-form"
            variant="primary"
            loading={submitting}
            disabled={!name.trim() || !effectiveSlug.trim()}
          >
            {t('create.submit')}
          </Button>
        </>
      }
    >
      <form id="product-form" className={layout.form} onSubmit={submit}>
        <FormField label={t('fields.name')} error={fields.name} required>
          <Input value={name} onChange={(event) => setName(event.target.value)} />
        </FormField>
        <FormField
          label={t('fields.slug')}
          help={t('create.slugHelp')}
          error={fields.slug}
          required
        >
          <Input
            value={effectiveSlug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
            spellCheck={false}
            autoComplete="off"
          />
        </FormField>
        <FormField label={t('fields.description')} error={fields.description}>
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} />
        </FormField>
      </form>
    </Dialog>
  );
}
