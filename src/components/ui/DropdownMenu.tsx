import * as Menu from '@radix-ui/react-dropdown-menu';
import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import clsx from '@/lib/clsx';
import styles from './DropdownMenu.module.css';

export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;
export const DropdownMenuGroup = Menu.Group;
export const DropdownMenuSub = Menu.Sub;

export function DropdownMenuContent({
  children,
  align = 'end',
  className,
}: {
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
  className?: string;
}) {
  return (
    <Menu.Portal>
      <Menu.Content align={align} sideOffset={6} className={clsx(styles.content, className)}>
        {children}
      </Menu.Content>
    </Menu.Portal>
  );
}

export function DropdownMenuItem({
  children,
  icon,
  onSelect,
  tone,
  disabled,
}: {
  children: ReactNode;
  icon?: ReactNode;
  onSelect?: () => void;
  tone?: 'danger';
  disabled?: boolean;
}) {
  return (
    <Menu.Item
      className={clsx(styles.item, tone === 'danger' && styles.danger)}
      onSelect={onSelect}
      disabled={disabled}
    >
      {icon ? <span className={styles.icon}>{icon}</span> : null}
      {children}
    </Menu.Item>
  );
}

export function DropdownMenuLabel({ children }: { children: ReactNode }) {
  return <Menu.Label className={styles.label}>{children}</Menu.Label>;
}

export function DropdownMenuSeparator() {
  return <Menu.Separator className={styles.separator} />;
}

export function DropdownMenuRadioGroup({
  value,
  onValueChange,
  label,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <Menu.RadioGroup value={value} onValueChange={onValueChange} aria-label={label}>
      {children}
    </Menu.RadioGroup>
  );
}

export function DropdownMenuRadioItem({
  value,
  children,
  icon,
}: {
  value: string;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <Menu.RadioItem value={value} className={styles.item}>
      {icon ? <span className={styles.icon}>{icon}</span> : null}
      <span className={styles.grow}>{children}</span>
      <Menu.ItemIndicator className={styles.indicator}>
        <Check aria-hidden />
      </Menu.ItemIndicator>
    </Menu.RadioItem>
  );
}

export function DropdownMenuSubTrigger({
  children,
  icon,
}: {
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <Menu.SubTrigger className={styles.item}>
      {icon ? <span className={styles.icon}>{icon}</span> : null}
      <span className={styles.grow}>{children}</span>
      <span aria-hidden className={styles.chevron}>
        ›
      </span>
    </Menu.SubTrigger>
  );
}

export function DropdownMenuSubContent({ children }: { children: ReactNode }) {
  return (
    <Menu.Portal>
      <Menu.SubContent sideOffset={4} className={styles.content}>
        {children}
      </Menu.SubContent>
    </Menu.Portal>
  );
}
