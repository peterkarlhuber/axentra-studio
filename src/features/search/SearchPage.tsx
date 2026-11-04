import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileSearch, Search, ShieldOff, Trash2 } from 'lucide-react';
import { Fragment, useId, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { searchApi } from '@/api/endpoints';
import type { SearchHit } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useCan, useErrorToast } from '@/app/auth';
import { useProductScope } from '@/app/contexts';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DetailList,
  Dialog,
  EmptyState,
  ErrorState,
  FormField,
  Input,
  JsonView,
  PageHeader,
  Skeleton,
  Spinner,
  Time,
  layout,
  useToast,
} from '@/components/ui';
import { TenantPicker } from '@/features/shared/TenantPicker';
import { SuspendedTenantGate } from '@/features/tenants/SuspendedTenantGate';
import { HelpLink } from '@/help/HelpLink';
import { useCursorList } from '@/lib/useCursorList';
import { kindsProblem, MAX_QUERY_LENGTH, parseHighlight, parseKinds } from './search-utils';
import styles from './search.module.css';

const PAGE_SIZE = 20;

/** Renders a server highlight with `<mark>` for matches; never as HTML. */
export function Highlight({ value }: { value: string | null | undefined }) {
  return (
    <>
      {parseHighlight(value).map((part, index) =>
        part.match ? (
          <mark key={index} className={styles.mark}>
            {part.text}
          </mark>
        ) : (
          // Plain text nodes, so the accessible name keeps the spaces around a match.
          <Fragment key={index}>{part.text}</Fragment>
        ),
      )}
    </>
  );
}

export function SearchPage() {
  const { t } = useTranslation('search');
  const { productId } = useProductScope();
  const can = useCan();
  const [params, setParams] = useSearchParams();
  const tenantId = params.get('tenant') ?? '';
  const q = params.get('q') ?? '';
  const kinds = parseKinds(params.get('kind') ?? '');
  const canQuery = tenantId ? can('search:query', { tenantId }) : false;
  const canIndex = tenantId ? can('search:index', { tenantId }) : false;

  const update = (changes: Record<string, string>) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        Object.entries(changes).forEach(([key, value]) =>
          value ? next.set(key, value) : next.delete(key),
        );
        return next;
      },
      { replace: true },
    );

  return (
    <div className={layout.stack}>
      <PageHeader title={t('title')} description={t('description')} help="search" />
      <Card>
        <div className={layout.form}>
          <div className={layout.row}>
            <TenantPicker
              productId={productId}
              value={tenantId}
              onChange={(id) => update({ tenant: id })}
            />
          </div>
          <SearchForm
            // A new URL (back/forward, a shared link) resets the fields to it.
            key={`${q}|${kinds.join(',')}`}
            initialQuery={q}
            initialKinds={kinds.join(', ')}
            disabled={!tenantId}
            onSearch={(query, kindList) => update({ q: query, kind: kindList.join(',') })}
          />
        </div>
      </Card>
      {!tenantId ? (
        <Card>
          <EmptyState icon={<Search />} title={t('pick.title')} description={t('pick.body')} />
        </Card>
      ) : !canQuery ? (
        <Card>
          <EmptyState
            icon={<ShieldOff />}
            title={t('noAccess.title')}
            description={
              <>
                {t('noAccess.body')}{' '}
                <HelpLink topic="search#permissions">{t('common:help.learnMore')}</HelpLink>
              </>
            }
          />
        </Card>
      ) : !q ? (
        <Card>
          <EmptyState icon={<FileSearch />} title={t('start.title')} description={<SyntaxHelp />} />
        </Card>
      ) : (
        <SuspendedTenantGate productId={productId} tenantId={tenantId} permission="search:query">
          <SearchResults
            key={`${tenantId}|${q}|${kinds.join(',')}`}
            productId={productId}
            tenantId={tenantId}
            q={q}
            kinds={kinds}
            canIndex={canIndex}
          />
        </SuspendedTenantGate>
      )}
    </div>
  );
}

function SyntaxHelp() {
  const { t } = useTranslation('search');
  return (
    <>
      <p>{t('start.body')}</p>
      <ul className={styles.syntax}>
        <li>
          <code>invoice acme</code> {t('syntax.all')}
        </li>
        <li>
          <code>&quot;late payment&quot;</code> {t('syntax.phrase')}
        </li>
        <li>
          <code>invoice or offer</code> {t('syntax.or')}
        </li>
        <li>
          <code>invoice -draft</code> {t('syntax.exclude')}
        </li>
      </ul>
      <p>
        <HelpLink topic="search#query">{t('common:help.learnMore')}</HelpLink>
      </p>
    </>
  );
}

function SearchForm({
  initialQuery,
  initialKinds,
  disabled,
  onSearch,
}: {
  initialQuery: string;
  initialKinds: string;
  disabled: boolean;
  onSearch: (query: string, kinds: string[]) => void;
}) {
  const { t } = useTranslation('search');
  const [query, setQuery] = useState(initialQuery);
  const [kindText, setKindText] = useState(initialKinds);
  const [touched, setTouched] = useState(false);
  const kinds = parseKinds(kindText);
  const problem = kindsProblem(kinds);
  const kindError = problem
    ? problem.reason === 'invalid'
      ? t('form.kindInvalid', { kind: problem.kind })
      : t('form.kindTooMany')
    : undefined;
  const queryError = touched && !query.trim() ? t('form.queryMissing') : undefined;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!query.trim() || problem) return;
    onSearch(query.trim(), kinds);
  };

  return (
    <form className={layout.form} onSubmit={submit} role="search" aria-label={t('form.label')}>
      <div className={layout.row}>
        <FormField label={t('form.query')} help={t('form.queryHelp')} error={queryError}>
          <Input
            type="search"
            value={query}
            maxLength={MAX_QUERY_LENGTH}
            onChange={(event) => setQuery(event.target.value)}
            disabled={disabled}
            autoComplete="off"
            enterKeyHint="search"
          />
        </FormField>
        <FormField label={t('form.kinds')} help={t('form.kindsHelp')} error={kindError}>
          <Input
            value={kindText}
            onChange={(event) => setKindText(event.target.value)}
            disabled={disabled}
            autoComplete="off"
            spellCheck={false}
            placeholder={t('form.kindsPlaceholder')}
          />
        </FormField>
      </div>
      <div>
        <Button type="submit" variant="primary" icon={<Search />} disabled={disabled}>
          {t('form.submit')}
        </Button>
      </div>
    </form>
  );
}

function SearchResults({
  productId,
  tenantId,
  q,
  kinds,
  canIndex,
}: {
  productId: string;
  tenantId: string;
  q: string;
  kinds: string[];
  canIndex: boolean;
}) {
  const { t } = useTranslation('search');
  const headingId = useId();
  const [open, setOpen] = useState<SearchHit | null>(null);
  const { query, rows } = useCursorList(
    queryKeys.search(productId, tenantId, { q, kinds }),
    (cursor) => searchApi.query(productId, tenantId, { q, kind: kinds, limit: PAGE_SIZE, cursor }),
  );

  if (query.isPending) {
    return (
      <Card>
        <div className={layout.form} aria-busy="true">
          <span className="ax-sr-only">{t('common:states.loading')}</span>
          <Skeleton />
          <Skeleton width="80%" />
          <Skeleton width="60%" />
        </div>
      </Card>
    );
  }
  if (query.isError) {
    return (
      <Card>
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </Card>
    );
  }
  const hits = rows ?? [];
  if (hits.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<FileSearch />}
          title={t('results.empty')}
          description={
            <>
              <p>{kinds.length > 0 ? t('results.emptyKinds') : t('results.emptyBody')}</p>
              <p>
                <HelpLink topic="search#no-results">{t('common:help.learnMore')}</HelpLink>
              </p>
            </>
          }
        />
      </Card>
    );
  }
  return (
    <Card flush>
      <section aria-labelledby={headingId} className={styles.results}>
        <h2 id={headingId} className="ax-sr-only">
          {t('results.heading', { query: q })}
        </h2>
        <ol className={styles.hitList}>
          {hits.map((hit) => (
            <li key={hit.id} className={styles.hit}>
              <h3 className={styles.hitTitle}>
                <button
                  type="button"
                  className={styles.hitButton}
                  onClick={() => setOpen(hit)}
                  aria-haspopup="dialog"
                >
                  {hit.title_highlight ? (
                    <Highlight value={hit.title_highlight} />
                  ) : (
                    <span className={layout.mono}>{hit.ref_id}</span>
                  )}
                </button>
              </h3>
              <p className={styles.hitMeta}>
                <Badge tone="info">{hit.kind}</Badge>
                <code className={layout.mono}>{hit.ref_id}</code>
                <span className={layout.muted}>
                  {t('results.updated')} <Time value={hit.updated_at} />
                </span>
              </p>
              {hit.body_highlight ? (
                <p className={styles.snippet}>
                  <Highlight value={hit.body_highlight} />
                </p>
              ) : null}
            </li>
          ))}
        </ol>
        <div className={styles.footer}>
          <span aria-live="polite" className={layout.muted}>
            {query.hasNextPage
              ? t('results.showing', { count: hits.length })
              : t('results.all', { count: hits.length })}
          </span>
          {query.hasNextPage ? (
            <Button onClick={() => void query.fetchNextPage()} loading={query.isFetchingNextPage}>
              {t('common:table.loadMore')}
            </Button>
          ) : null}
          {query.isRefetching && !query.isFetchingNextPage ? <Spinner size="sm" /> : null}
        </div>
      </section>
      <DocumentDrawer
        productId={productId}
        tenantId={tenantId}
        hit={open}
        canIndex={canIndex}
        onClose={() => setOpen(null)}
      />
    </Card>
  );
}

function DocumentDrawer({
  productId,
  tenantId,
  hit,
  canIndex,
  onClose,
}: {
  productId: string;
  tenantId: string;
  hit: SearchHit | null;
  canIndex: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation('search');
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const [removing, setRemoving] = useState(false);
  const document = useQuery({
    queryKey: queryKeys.searchDocument(productId, tenantId, hit?.kind ?? '', hit?.ref_id ?? ''),
    queryFn: () => searchApi.document(productId, tenantId, hit?.kind ?? '', hit?.ref_id ?? ''),
    enabled: hit !== null,
  });
  const doc = document.data;

  return (
    <>
      <Dialog
        open={hit !== null && !removing}
        onOpenChange={(next) => (next ? undefined : onClose())}
        variant="drawer"
        title={hit?.title || hit?.ref_id || t('document.title')}
        description={hit ? `${hit.kind} · ${hit.ref_id}` : undefined}
      >
        {document.isPending ? (
          <div className={layout.form} aria-busy="true">
            <Skeleton />
            <Skeleton width="70%" />
            <Skeleton width="50%" />
          </div>
        ) : document.isError ? (
          <ErrorState
            error={document.error}
            onRetry={() => void document.refetch()}
            compact
            headingLevel={3}
          />
        ) : doc ? (
          <div className={layout.form}>
            {canIndex ? (
              <div className={layout.actions}>
                <Button variant="danger" icon={<Trash2 />} onClick={() => setRemoving(true)}>
                  {t('document.remove')}
                </Button>
              </div>
            ) : null}
            <DetailList
              items={[
                { label: t('document.kind'), value: doc.kind, mono: true },
                { label: t('document.refId'), value: doc.ref_id, mono: true },
                { label: t('document.id'), value: doc.id, mono: true },
                { label: t('document.version'), value: doc.version },
                { label: t('document.language'), value: doc.language, mono: true },
                { label: t('document.createdBy'), value: doc.created_by, mono: true },
                { label: t('document.updatedBy'), value: doc.updated_by, mono: true },
                {
                  label: t('document.created'),
                  value: <Time value={doc.created_at} mode="absolute" />,
                },
                {
                  label: t('document.updated'),
                  value: <Time value={doc.updated_at} mode="absolute" />,
                },
              ]}
            />
            <div>
              <h3 className={styles.sectionTitle}>{t('document.body')}</h3>
              {doc.body ? (
                <div
                  className={styles.body}
                  tabIndex={0}
                  role="region"
                  aria-label={t('document.body')}
                >
                  {doc.body}
                </div>
              ) : (
                <p className={layout.muted}>{t('document.noBody')}</p>
              )}
            </div>
            <JsonView value={doc.metadata ?? {}} label={t('document.metadata')} />
            <p className={layout.muted}>
              {t('document.derived')}{' '}
              <HelpLink topic="search#index">{t('common:help.learnMore')}</HelpLink>
            </p>
          </div>
        ) : null}
      </Dialog>
      <ConfirmDialog
        open={removing && hit !== null}
        onOpenChange={(next) => {
          if (!next) setRemoving(false);
        }}
        title={t('document.removeTitle')}
        description={t('document.removeBody', { kind: hit?.kind, ref: hit?.ref_id })}
        confirmLabel={t('document.remove')}
        onConfirm={async () => {
          if (!hit) return;
          try {
            await searchApi.removeDocument(productId, tenantId, hit.kind, hit.ref_id);
          } catch (error) {
            showError(error);
            throw error;
          }
          toast.success(t('document.removed', { ref: hit.ref_id }));
          setRemoving(false);
          onClose();
          void queryClient.invalidateQueries({
            queryKey: ['products', productId, 'search', tenantId],
          });
        }}
      />
    </>
  );
}
