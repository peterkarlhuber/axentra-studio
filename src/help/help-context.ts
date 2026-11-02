import { createContext, useContext } from 'react';
import type { HelpTopic } from './manifest';

export interface HelpContextValue {
  /** Open the side panel on an article (and section). */
  openHelp: (topic: HelpTopic) => void;
  closeHelp: () => void;
}

export const HelpContext = createContext<HelpContextValue | null>(null);

export function useHelp(): HelpContextValue {
  const value = useContext(HelpContext);
  if (!value) throw new Error('useHelp needs a HelpProvider');
  return value;
}

/** The help center route for a topic: `tenants#suspend` -> `/help/tenants#suspend`. */
export function helpHref(topic: HelpTopic): string {
  const [article, anchor] = topic.split('#');
  return `/help/${article}${anchor ? `#${anchor}` : ''}`;
}
