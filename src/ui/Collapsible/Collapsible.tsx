import React, { type ReactNode } from "react";
import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import styles from "./Collapsible.module.css";

export interface CollapsibleProps {
  trigger: ReactNode;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  triggerClassName?: string;
  "data-filter-state"?: string;
}

export function Collapsible({
  trigger,
  triggerClassName,
  children,
  className,
  open,
  onOpenChange,
  "data-filter-state": dataFilterState,
}: CollapsibleProps): React.JSX.Element {
  return (
    <BaseCollapsible.Root
      open={open}
      onOpenChange={onOpenChange ? (isOpen) => onOpenChange(isOpen) : undefined}
      className={className}
      data-filter-state={dataFilterState}
    >
      <BaseCollapsible.Trigger className={triggerClassName}>{trigger}</BaseCollapsible.Trigger>
      <BaseCollapsible.Panel className={styles.panel}>
        <div className={styles.panelInner}>{children}</div>
      </BaseCollapsible.Panel>
    </BaseCollapsible.Root>
  );
}
