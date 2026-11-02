import { useTranslation } from 'react-i18next';
import { Tabs } from '@/components/ui';
import { previewDocument } from './notify-utils';
import styles from './notify.module.css';

/**
 * Subject, HTML and text of a rendered notification. HTML is shown in a sandboxed frame that
 * cannot run scripts, reach the Studio's origin or load anything from the network.
 */
export function RenderedView({
  subject,
  html,
  text,
  label,
}: {
  subject: string;
  html: string | null | undefined;
  text: string;
  /** Accessible name of the frame and the tab list. */
  label: string;
}) {
  const { t } = useTranslation('notify');
  return (
    <div className={styles.rendered}>
      <p className={styles.subject}>
        <span className={styles.subjectLabel}>{t('preview.subject')}</span> {subject}
      </p>
      <Tabs
        // Switch to the HTML tab once a body appears (e.g. while editing a draft).
        key={html ? 'with-html' : 'text-only'}
        label={label}
        defaultValue={html ? 'html' : 'text'}
        items={[
          {
            value: 'html',
            label: t('preview.html'),
            content: html ? (
              <iframe
                className={styles.frame}
                title={label}
                sandbox=""
                referrerPolicy="no-referrer"
                srcDoc={previewDocument(html)}
              />
            ) : (
              <p className={styles.noHtml}>{t('preview.noHtml')}</p>
            ),
          },
          {
            value: 'text',
            label: t('preview.text'),
            content: <pre className={styles.text}>{text}</pre>,
          },
        ]}
      />
    </div>
  );
}
