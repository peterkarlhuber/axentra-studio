/**
 * Derive a URL-friendly slug ("Acme GmbH & Co." -> "acme-gmbh-co"). Used to prefill the
 * required `slug` fields; the user can still edit it and the server validates it.
 */
export function slugify(value: string, separator: '-' | '_' = '-'): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, separator)
    .replace(new RegExp(`^\\${separator}+|\\${separator}+$`, 'g'), '')
    .slice(0, 63);
}
