import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';

export interface OidcIssuer {
  issuer: string;
  name: string;
}

/**
 * The issuers of the server's single sign-on providers (`GET /v1/settings` `oidc_providers`),
 * to suggest values for an identity's provider and to name a linked identity's issuer. The
 * settings are readable for platform administrators (and product managers); without them the
 * list is empty and the provider stays a free-text field.
 */
export function useOidcIssuers(enabled: boolean): OidcIssuer[] {
  const settings = useQuery({
    queryKey: queryKeys.settings,
    queryFn: settingsApi.get,
    enabled,
    retry: false,
    staleTime: 5 * 60_000,
  });
  return parseIssuers(settings.data?.oidc_providers);
}

export function parseIssuers(providers: readonly Record<string, unknown>[] | undefined) {
  const out: OidcIssuer[] = [];
  for (const provider of providers ?? []) {
    const issuer = typeof provider.issuer === 'string' ? provider.issuer : '';
    if (!issuer || out.some((entry) => entry.issuer === issuer)) continue;
    const name =
      typeof provider.name === 'string' && provider.name
        ? provider.name
        : typeof provider.id === 'string'
          ? provider.id
          : issuer;
    out.push({ issuer, name });
  }
  return out;
}

/** The provider's display name for an issuer, if the server configures it. */
export function issuerName(issuers: readonly OidcIssuer[], issuer: string): string | undefined {
  return issuers.find((entry) => entry.issuer === issuer)?.name;
}
