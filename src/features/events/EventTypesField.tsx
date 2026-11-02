import { useQuery } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { useId, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { eventsApi } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';
import { Button, FormField, Input } from '@/components/ui';
import { EVENT_PATTERN, splitPatterns } from './events-utils';
import styles from './events.module.css';

const MAX_PATTERNS = 50;
const SUGGESTION_SAMPLE = 100;

/**
 * Event type patterns for a webhook endpoint (`invoice.*`, `user.created`, `*`). Axentra has
 * no catalog of event types, so suggestions come from the types seen in the latest events.
 */
export function EventTypesField({
  productId,
  value,
  onChange,
  error,
}: {
  productId: string;
  value: string[];
  onChange: (patterns: string[]) => void;
  error?: string;
}) {
  const { t } = useTranslation('events');
  const [draft, setDraft] = useState('');
  const listId = useId();
  const sampleParams = { limit: SUGGESTION_SAMPLE };
  const recent = useQuery({
    queryKey: queryKeys.events(productId, sampleParams),
    queryFn: () => eventsApi.list(productId, sampleParams),
    staleTime: 60_000,
  });
  const seen = [...new Set((recent.data?.items ?? []).map((event) => event.type))].sort();
  const suggestions = ['*', ...seen].filter((type) => !value.includes(type)).slice(0, 12);
  const draftPatterns = splitPatterns(draft);
  const invalid = draftPatterns.filter((pattern) => !EVENT_PATTERN.test(pattern));

  const add = (patterns: string[]) => {
    const valid = patterns.filter((pattern) => EVENT_PATTERN.test(pattern));
    if (valid.length === 0) return;
    onChange([...new Set([...value, ...valid])].slice(0, MAX_PATTERNS));
    setDraft('');
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (invalid.length === 0) add(draftPatterns);
    }
  };

  return (
    <div className={styles.typesField}>
      <FormField
        label={t('webhooks.eventTypes')}
        help={t('webhooks.eventTypesHelp')}
        info={t('webhooks.eventTypesInfo')}
        infoTopic="webhooks#event-types"
        error={invalid.length > 0 ? t('validation.patterns') : error}
        required
      >
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="invoice.*"
          list={listId}
          autoComplete="off"
          spellCheck={false}
        />
      </FormField>
      <datalist id={listId}>
        {seen.map((type) => (
          <option key={type} value={type} />
        ))}
      </datalist>
      <div className={styles.typesActions}>
        <Button
          size="sm"
          icon={<Plus />}
          disabled={draftPatterns.length === 0 || invalid.length > 0}
          onClick={() => add(draftPatterns)}
        >
          {t('webhooks.addType')}
        </Button>
      </div>
      {value.length > 0 ? (
        <ul className={styles.chips} aria-label={t('webhooks.selectedTypes')}>
          {value.map((pattern) => (
            <li key={pattern} className={styles.chip}>
              <code>{pattern}</code>
              <button
                type="button"
                className={styles.chipRemove}
                aria-label={t('webhooks.removeType', { type: pattern })}
                onClick={() => onChange(value.filter((item) => item !== pattern))}
              >
                <X aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.hint}>{t('webhooks.noTypes')}</p>
      )}
      {suggestions.length > 0 ? (
        <div className={styles.suggestions} role="group" aria-label={t('webhooks.suggestions')}>
          <span className={styles.hint}>{t('webhooks.suggestions')}:</span>
          {suggestions.map((type) => (
            <Button
              key={type}
              size="sm"
              variant="subtle"
              aria-label={t('webhooks.addSuggestion', {
                type: type === '*' ? t('webhooks.allTypes') : type,
              })}
              onClick={() => add([type])}
            >
              {type === '*' ? t('webhooks.allTypes') : type}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
