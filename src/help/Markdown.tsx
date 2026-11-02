import { Lexer, type Token, type Tokens } from 'marked';
import { Fragment, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { AlertTriangle, Info, Lightbulb, OctagonAlert, ShieldAlert } from 'lucide-react';
import { CopyButton } from './CopyButton';
import { DIAGRAMS, isDiagramName } from './diagrams';
import { splitHeadingAnchor } from './frontmatter';
import { resolveAppLink } from './app-links';
import { isHelpArticleId, type HelpArticleId, type HelpTopic } from './manifest';
import styles from './help.module.css';

export type CalloutKind = 'note' | 'tip' | 'important' | 'warning' | 'caution';
const CALLOUT = /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/;
const CALLOUT_ICONS: Record<CalloutKind, ReactNode> = {
  note: <Info />,
  tip: <Lightbulb />,
  important: <ShieldAlert />,
  warning: <AlertTriangle />,
  caution: <OctagonAlert />,
};

export interface MarkdownContext {
  /** Builds the href of a help topic (help center route, or the side panel's own handler). */
  topicHref: (topic: HelpTopic) => string;
  /** Called instead of navigating, e.g. to switch the side panel to another article. */
  onTopic?: (topic: HelpTopic) => void;
  productId?: string;
  /** Prefix for heading ids, so the side panel and the page never share an id. */
  idPrefix?: string;
  /** The article being rendered, for same-page `#anchor` links. */
  articleId?: HelpArticleId;
  /** Added to heading levels (1 in the side panel, whose title is already an h2). */
  headingShift?: 0 | 1;
}

/** Renders marked tokens to React elements. Raw HTML is shown as text, never injected. */
export function Markdown({ tokens, context }: { tokens: Token[]; context: MarkdownContext }) {
  return <>{renderBlocks(tokens, context)}</>;
}

function renderBlocks(tokens: Token[], ctx: MarkdownContext): ReactNode[] {
  return tokens.map((token, index) => <Block key={index} token={token} ctx={ctx} />);
}

function Block({ token, ctx }: { token: Token; ctx: MarkdownContext }): ReactNode {
  switch (token.type) {
    case 'heading': {
      const heading = token as Tokens.Heading;
      const { id } = splitHeadingAnchor(heading.text);
      const inline = stripAnchorTokens(heading.tokens);
      const level = Math.min(Math.max(heading.depth, 2) + (ctx.headingShift ?? 0), 5) as
        2 | 3 | 4 | 5;
      const Tag = `h${level}` as const;
      const domId = id ? `${ctx.idPrefix ?? ''}${id}` : undefined;
      return (
        <Tag id={domId} className={styles[`h${level}`]} tabIndex={domId ? -1 : undefined}>
          {renderInline(inline, ctx)}
          {domId ? (
            <a className={styles.anchor} href={`#${domId}`} aria-hidden="true" tabIndex={-1}>
              #
            </a>
          ) : null}
        </Tag>
      );
    }
    case 'paragraph':
      return <p>{renderInline((token as Tokens.Paragraph).tokens, ctx)}</p>;
    case 'text': {
      const text = token as Tokens.Text;
      return <p>{text.tokens ? renderInline(text.tokens, ctx) : text.text}</p>;
    }
    case 'list': {
      const list = token as Tokens.List;
      const items = list.items.map((item, index) => (
        <li key={index}>{renderListItem(item, ctx)}</li>
      ));
      return list.ordered ? (
        <ol start={typeof list.start === 'number' && list.start !== 1 ? list.start : undefined}>
          {items}
        </ol>
      ) : (
        <ul>{items}</ul>
      );
    }
    case 'blockquote':
      return <Blockquote token={token as Tokens.Blockquote} ctx={ctx} />;
    case 'code': {
      const code = token as Tokens.Code;
      const lang = (code.lang ?? '').trim();
      if (lang === 'diagram') {
        const name = code.text.trim();
        if (isDiagramName(name)) {
          const Diagram = DIAGRAMS[name];
          return <Diagram />;
        }
        return null;
      }
      return <CodeBlock code={code.text} language={lang} />;
    }
    case 'table':
      return <Table token={token as Tokens.Table} ctx={ctx} />;
    case 'hr':
      return <hr />;
    case 'space':
      return null;
    case 'html':
      return <p>{(token as Tokens.HTML).text}</p>;
    default:
      return 'raw' in token ? <p>{String(token.raw)}</p> : null;
  }
}

function renderListItem(item: Tokens.ListItem, ctx: MarkdownContext): ReactNode {
  // Tight list items contain a single `text` token; render its inline content without <p>.
  return item.tokens.map((child, index) => {
    if (child.type !== 'text') return <Block key={index} token={child} ctx={ctx} />;
    const text = child as Tokens.Text;
    return (
      <Fragment key={index}>{text.tokens ? renderInline(text.tokens, ctx) : text.text}</Fragment>
    );
  });
}

function Blockquote({ token, ctx }: { token: Tokens.Blockquote; ctx: MarkdownContext }) {
  const { t } = useTranslation('help');
  const first = token.tokens[0];
  const match = first && first.type === 'paragraph' ? CALLOUT.exec(first.raw) : null;
  if (!match) return <blockquote>{renderBlocks(token.tokens, ctx)}</blockquote>;
  const kind = (match[1] ?? 'NOTE').toLowerCase() as CalloutKind;
  const paragraph = first as Tokens.Paragraph;
  const rest = paragraph.raw.slice(match[0].length).trim();
  const blocks: Token[] = [
    ...(rest ? (markedInlineParagraph(rest) as Token[]) : []),
    ...token.tokens.slice(1),
  ];
  return (
    <aside className={styles.callout} data-kind={kind} aria-label={t(`callout.${kind}`)}>
      <span className={styles.calloutIcon} aria-hidden="true">
        {CALLOUT_ICONS[kind]}
      </span>
      <div className={styles.calloutBody}>
        <p className={styles.calloutTitle}>{t(`callout.${kind}`)}</p>
        {renderBlocks(blocks, ctx)}
      </div>
    </aside>
  );
}

function Table({ token, ctx }: { token: Tokens.Table; ctx: MarkdownContext }) {
  const { t } = useTranslation('help');
  return (
    <div className={styles.tableWrap} tabIndex={0} role="region" aria-label={t('article.table')}>
      <table>
        <thead>
          <tr>
            {token.header.map((cell, index) => (
              <th key={index} scope="col" style={{ textAlign: token.align[index] ?? undefined }}>
                {renderInline(cell.tokens, ctx)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {token.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, index) => (
                <td key={index} style={{ textAlign: token.align[index] ?? undefined }}>
                  {renderInline(cell.tokens, ctx)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const { t } = useTranslation('help');
  return (
    <div className={styles.code}>
      <div className={styles.codeBar}>
        <span className={styles.codeLang}>{language || t('article.code')}</span>
        <CopyButton value={code} />
      </div>
      <pre
        tabIndex={0}
        role="region"
        aria-label={t('article.codeExample', { language: language || 'text' })}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

function stripAnchorTokens(tokens: Token[]): Token[] {
  const copy = [...tokens];
  const last = copy[copy.length - 1];
  if (last && last.type === 'text') {
    const { text } = splitHeadingAnchor((last as Tokens.Text).text);
    copy[copy.length - 1] = { ...last, text, raw: text } as Token;
  }
  return copy;
}

/** Paragraph tokens for the text that follows a `[!KIND]` marker. */
function markedInlineParagraph(text: string): Token[] {
  return [
    {
      type: 'paragraph',
      raw: text,
      text,
      tokens: inlineLexer(text),
    } as Tokens.Paragraph,
  ];
}

function inlineLexer(text: string): Token[] {
  return new Lexer({ gfm: true }).inlineTokens(text);
}

function renderInline(tokens: Token[] | undefined, ctx: MarkdownContext): ReactNode[] {
  if (!tokens) return [];
  return tokens.map((token, index) => <Inline key={index} token={token} ctx={ctx} />);
}

function Inline({ token, ctx }: { token: Token; ctx: MarkdownContext }): ReactNode {
  switch (token.type) {
    case 'text': {
      const text = token as Tokens.Text;
      return text.tokens ? renderInline(text.tokens, ctx) : decode(text.text);
    }
    case 'escape':
      return decode((token as Tokens.Escape).text);
    case 'strong':
      return <strong>{renderInline((token as Tokens.Strong).tokens, ctx)}</strong>;
    case 'em':
      return <em>{renderInline((token as Tokens.Em).tokens, ctx)}</em>;
    case 'del':
      return <del>{renderInline((token as Tokens.Del).tokens, ctx)}</del>;
    case 'codespan':
      return <code>{decode((token as Tokens.Codespan).text)}</code>;
    case 'br':
      return <br />;
    case 'link':
      return <MarkdownLink token={token as Tokens.Link} ctx={ctx} />;
    case 'image':
      return decode((token as Tokens.Image).text);
    case 'html':
      return (token as Tokens.HTML).text;
    default:
      return 'raw' in token ? String(token.raw) : null;
  }
}

function MarkdownLink({ token, ctx }: { token: Tokens.Link; ctx: MarkdownContext }) {
  const children = renderInline(token.tokens, ctx);
  const href = token.href;
  if (href.startsWith('help:')) {
    const topic = href.slice(5);
    const article = topic.split('#')[0] ?? '';
    if (!isHelpArticleId(article)) return <>{children}</>;
    const helpTopic = topic as HelpTopic;
    return (
      <Link
        to={ctx.topicHref(helpTopic)}
        onClick={
          ctx.onTopic
            ? (event) => {
                event.preventDefault();
                ctx.onTopic?.(helpTopic);
              }
            : undefined
        }
      >
        {children}
      </Link>
    );
  }
  if (href.startsWith('#') && ctx.articleId) {
    const topic = `${ctx.articleId}${href}` as HelpTopic;
    return (
      <Link
        to={ctx.onTopic ? ctx.topicHref(topic) : { hash: href.slice(1) }}
        onClick={
          ctx.onTopic
            ? (event) => {
                event.preventDefault();
                ctx.onTopic?.(topic);
              }
            : undefined
        }
      >
        {children}
      </Link>
    );
  }
  if (href.startsWith('app:')) {
    const path = resolveAppLink(href.slice(4), ctx.productId);
    return path ? <Link to={path}>{children}</Link> : <>{children}</>;
  }
  if (/^https:\/\//.test(href)) {
    return (
      <a href={href} target="_blank" rel="noreferrer noopener">
        {children}
      </a>
    );
  }
  return <>{children}</>;
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};
/** marked escapes text for HTML output; React escapes on its own, so undo it. */
function decode(text: string): string {
  return text.replace(/&(amp|lt|gt|quot|#39);/g, (entity) => ENTITIES[entity] ?? entity);
}
