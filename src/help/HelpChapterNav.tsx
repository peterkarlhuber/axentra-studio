import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';
import type { HelpLibrary } from './content';
import { HELP_CHAPTERS, type HelpArticleId } from './manifest';
import styles from './help.module.css';

/** Chapter list with all articles; the current article is marked with aria-current. */
export function HelpChapterNav({
  library,
  current,
}: {
  library: HelpLibrary;
  current?: HelpArticleId;
}) {
  const { t } = useTranslation('help');
  return (
    <nav aria-label={t('article.chapterNav')} className={styles.chapterNav}>
      {HELP_CHAPTERS.map((chapter) => (
        <div key={chapter.id} className={styles.chapterGroup}>
          <p className={styles.chapterTitle} id={`help-chapter-${chapter.id}`}>
            {t(`chapters.${chapter.id}`)}
          </p>
          <ul aria-labelledby={`help-chapter-${chapter.id}`}>
            {chapter.articles.map((id) => (
              <li key={id}>
                <NavLink
                  to={`/help/${id}`}
                  className={styles.chapterLink}
                  aria-current={id === current ? 'page' : undefined}
                >
                  {library.get(id)?.title ?? id}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
