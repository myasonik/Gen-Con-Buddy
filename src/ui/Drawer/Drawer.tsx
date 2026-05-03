import React from "react";
import { X } from "lucide-react";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "../Button/Button";
import styles from "./Drawer.module.css";

interface DrawerProps {
  trigger: React.ReactNode;
  title: string;
  footer?: React.ReactNode;
  side?: "left" | "right";
  children: React.ReactNode;
}

export function Drawer({
  trigger,
  title,
  footer,
  side = "left",
  children,
}: DrawerProps): React.JSX.Element {
  return (
    <Dialog.Root>
      <Dialog.Trigger render={trigger as React.ReactElement} />
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Popup
          className={styles.drawer}
          data-side={side}
        >
          <div className={styles.drawerHeader}>
            <Dialog.Title className={styles.drawerTitle}>{title}</Dialog.Title>
            <Dialog.Close
              render={
                <Button type="button" variant="ghost" icon aria-label="Close">
                  <X size={16} aria-hidden="true" />
                </Button>
              }
            />
          </div>
          <div className={styles.drawerScroll}>{children}</div>
          {footer !== undefined && (
            <div className={styles.drawerFooter} data-testid="drawer-footer">
              {footer}
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
