import { Search, X } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import styles from './help.module.css';

/** Search field of the help center; submitting goes to `/help?q=…` (shareable, back works). */
export function HelpSearchBox({
  initial = '',
  onQueryChange,
}: {
  initial?: string;
  /** Live search on the home page; elsewhere the box submits to the home page. */
  onQueryChange?: (query: string) => void;
}) {
  const { t } = useTranslation('help');
  const navigate = useNavigate();
  const id = useId();
  const [value, setValue] = useState(initial);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const query = value.trim();
    if (onQueryChange) onQueryChange(query);
    else void navigate(query ? `/help?q=${encodeURIComponent(query)}` : '/help');
  };

  return (
    <form role="search" className={styles.search} onSubmit={submit}>
      <label htmlFor={id} className="ax-sr-only">
        {t('search.label')}
      </label>
      <Search aria-hidden="true" className={styles.searchIcon} />
      <input
        id={id}
        type="search"
        value={value}
        placeholder={t('search.placeholder')}
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => {
          setValue(event.target.value);
          onQueryChange?.(event.target.value.trim());
        }}
      />
      {value ? (
        <button
          type="button"
          className={styles.searchClear}
          aria-label={t('search.clear')}
          onClick={() => {
            setValue('');
            onQueryChange?.('');
          }}
        >
          <X aria-hidden="true" />
        </button>
      ) : null}
    </form>
  );
}
