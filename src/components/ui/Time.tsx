import { useFormatters } from '@/lib/format';

/**
 * Relative time ("3 hours ago") with the absolute timestamp as `title` and a
 * machine-readable `datetime`. Detail views use `mode="absolute"`.
 */
export function Time({
  value,
  mode = 'relative',
}: {
  value: string | null | undefined;
  mode?: 'relative' | 'absolute';
}) {
  const format = useFormatters();
  if (!value) return <span>—</span>;
  const absolute = format.dateTime(value);
  if (mode === 'absolute') return <time dateTime={value}>{absolute}</time>;
  return (
    <time dateTime={value} title={absolute}>
      {format.relative(value)}
    </time>
  );
}
