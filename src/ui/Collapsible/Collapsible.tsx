import React, { type ReactNode } from "react";
import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import styles from "./Collapsible.module.css";

export interface CollapsibleProps {
  trigger: ReactNode;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (isOpen: boolean, event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  triggerClassName?: string;
}

export function Collapsible({
  trigger,
  triggerClassName,
  children,
  className,
  open,
  onOpenChange,
}: CollapsibleProps): React.JSX.Element {
  const handleOpenChange = (isOpen: boolean, eventDetails: unknown): void => {
    if (
      onOpenChange &&
      eventDetails &&
      typeof eventDetails === "object" &&
      "event" in eventDetails
    ) {
      const { event } = eventDetails as { event: unknown };
      if (event instanceof MouseEvent && event.target instanceof HTMLButtonElement) {
        onOpenChange(isOpen, event as unknown as React.MouseEvent<HTMLButtonElement>);
      }
    }
  };

  return (
    <BaseCollapsible.Root open={open} onOpenChange={handleOpenChange} className={className}>
      <BaseCollapsible.Trigger className={triggerClassName}>{trigger}</BaseCollapsible.Trigger>
      <BaseCollapsible.Panel className={styles.panel}>
        <div className={styles.panelInner}>{children}</div>
      </BaseCollapsible.Panel>
    </BaseCollapsible.Root>
  );
}
