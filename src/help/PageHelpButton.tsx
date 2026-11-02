import { CircleHelp } from 'lucide-react';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { IconButton } from '@/components/ui/IconButton';
import { HelpContext, helpHref } from './help-context';
import type { HelpTopic } from './manifest';

/** The "?" button in page headers: opens the page's article in the help side panel. */
export function PageHelpButton({ topic }: { topic: HelpTopic }) {
  const { t } = useTranslation('help');
  const help = useContext(HelpContext);
  const navigate = useNavigate();
  return (
    <IconButton
      variant="secondary"
      label={t('pageHelp')}
      icon={<CircleHelp />}
      data-page-help={topic}
      onClick={() => (help ? help.openHelp(topic) : void navigate(helpHref(topic)))}
    />
  );
}
