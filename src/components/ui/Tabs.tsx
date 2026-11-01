import * as RadixTabs from '@radix-ui/react-tabs';
import type { ReactNode } from 'react';
import styles from './Tabs.module.css';

export interface TabItem {
  value: string;
  label: ReactNode;
  content: ReactNode;
  hidden?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  label: string;
}

export function Tabs({ items, value, defaultValue, onValueChange, label }: TabsProps) {
  const visible = items.filter((item) => !item.hidden);
  return (
    <RadixTabs.Root
      className={styles.root}
      value={value}
      defaultValue={defaultValue ?? visible[0]?.value}
      onValueChange={onValueChange}
    >
      <RadixTabs.List className={styles.list} aria-label={label}>
        {visible.map((item) => (
          <RadixTabs.Trigger key={item.value} value={item.value} className={styles.trigger}>
            {item.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {visible.map((item) => (
        <RadixTabs.Content key={item.value} value={item.value} className={styles.content}>
          {item.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}
