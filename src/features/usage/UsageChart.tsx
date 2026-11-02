import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TimePoint } from '@/api/models';
import { useFormatters } from '@/lib/format';
import { formatDay, formatQuantity, niceTicks } from './usage-utils';
import styles from './usage.module.css';

const HEIGHT = 220;
const MARGIN = { top: 12, right: 12, bottom: 28, left: 56 };

/**
 * Daily usage as an inline SVG bar chart (no chart library). One series, so the bars use the
 * primary token and the title names the series; colors come from tokens and follow the theme.
 * Screen readers get a summary label and a data table with every day.
 */
export function UsageChart({
  points,
  unit,
  title,
}: {
  points: TimePoint[];
  unit: string;
  title: string;
}) {
  const { t } = useTranslation('usage');
  const { locale } = useFormatters();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const element = wrapRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width;
      if (next && next > 0) setWidth(Math.round(next));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const quantity = (value: number) => formatQuantity(value, locale);
  const withUnit = (value: number) => (unit ? `${quantity(value)} ${unit}` : quantity(value));
  const max = Math.max(0, ...points.map((point) => point.value));
  const total = points.reduce((sum, point) => sum + point.value, 0);
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1] ?? 1;
  const plotWidth = Math.max(40, width - MARGIN.left - MARGIN.right);
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const slot = points.length ? plotWidth / points.length : plotWidth;
  const barWidth = Math.max(1, Math.min(28, slot - 2));
  const y = (value: number) => MARGIN.top + plotHeight - (value / top) * plotHeight;
  const labelEvery = Math.max(
    1,
    Math.ceil(points.length / Math.max(2, Math.floor(plotWidth / 64))),
  );
  const first = points[0];
  const last = points[points.length - 1];
  const summary =
    first && last
      ? t('chart.summary', {
          title,
          from: formatDay(first.day, locale, 'medium'),
          to: formatDay(last.day, locale, 'medium'),
          total: withUnit(total),
          max: withUnit(max),
        })
      : title;
  const active = hover !== null ? points[hover] : undefined;

  return (
    <figure className={styles.figure}>
      <figcaption className={styles.figcaption}>{title}</figcaption>
      <div ref={wrapRef} className={styles.chartWrap} onMouseLeave={() => setHover(null)}>
        <svg
          className={styles.chart}
          width={width}
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          role="img"
          aria-label={summary}
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                className={styles.grid}
                x1={MARGIN.left}
                x2={MARGIN.left + plotWidth}
                y1={y(tick)}
                y2={y(tick)}
              />
              <text
                className={styles.axisText}
                x={MARGIN.left - 8}
                y={y(tick)}
                dy="0.32em"
                textAnchor="end"
              >
                {new Intl.NumberFormat(locale, {
                  notation: 'compact',
                  maximumFractionDigits: 1,
                }).format(tick)}
              </text>
            </g>
          ))}
          {points.map((point, index) => {
            const x = MARGIN.left + index * slot + (slot - barWidth) / 2;
            const barTop = y(point.value);
            const barHeight = MARGIN.top + plotHeight - barTop;
            return (
              <g key={point.day}>
                {point.value > 0 ? (
                  <path
                    className={hover === index ? styles.barActive : styles.bar}
                    d={roundedTopBar(x, barTop, barWidth, barHeight, Math.min(4, barWidth / 2))}
                  />
                ) : null}
                {/* Hit target taller and wider than the mark. */}
                <rect
                  className={styles.hit}
                  x={MARGIN.left + index * slot}
                  y={MARGIN.top}
                  width={slot}
                  height={plotHeight}
                  onMouseEnter={() => setHover(index)}
                />
                {index % labelEvery === 0 ? (
                  <text
                    className={styles.axisText}
                    x={MARGIN.left + index * slot + slot / 2}
                    y={HEIGHT - 8}
                    textAnchor="middle"
                  >
                    {formatDay(point.day, locale)}
                  </text>
                ) : null}
              </g>
            );
          })}
          <line
            className={styles.baseline}
            x1={MARGIN.left}
            x2={MARGIN.left + plotWidth}
            y1={MARGIN.top + plotHeight}
            y2={MARGIN.top + plotHeight}
          />
        </svg>
        {active && hover !== null ? (
          <div
            className={styles.tooltip}
            style={{
              left: Math.min(
                Math.max(MARGIN.left + hover * slot + slot / 2, 80),
                Math.max(80, width - 80),
              ),
            }}
            aria-hidden="true"
          >
            <strong>{formatDay(active.day, locale, 'medium')}</strong>
            <span>{withUnit(active.value)}</span>
            <span>{t('chart.events', { count: active.event_count })}</span>
          </div>
        ) : null}
      </div>
      <details className={styles.tableDetails}>
        <summary>{t('chart.showTable')}</summary>
        <div
          className={styles.tableScroll}
          role="region"
          aria-label={t('chart.tableCaption', { title })}
          tabIndex={0}
        >
          <table className={styles.dataTable}>
            <caption className="ax-sr-only">{t('chart.tableCaption', { title })}</caption>
            <thead>
              <tr>
                <th scope="col">{t('chart.day')}</th>
                <th scope="col">{unit ? t('chart.valueUnit', { unit }) : t('chart.value')}</th>
                <th scope="col">{t('chart.eventCount')}</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.day}>
                  <th scope="row">
                    <time dateTime={point.day}>{formatDay(point.day, locale, 'medium')}</time>
                  </th>
                  <td>{quantity(point.value)}</td>
                  <td>{quantity(point.event_count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

/** Bar with 4px rounded data end (top) and a square baseline. */
function roundedTopBar(x: number, top: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, height);
  const bottom = top + height;
  return [
    `M${x},${bottom}`,
    `V${top + r}`,
    `Q${x},${top} ${x + r},${top}`,
    `H${x + width - r}`,
    `Q${x + width},${top} ${x + width},${top + r}`,
    `V${bottom}`,
    'Z',
  ].join(' ');
}
