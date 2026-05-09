import React from "react";
import { Button } from "../../ui/Button/Button";
import { Drawer } from "../../ui/Drawer/Drawer";

export function SortDrawer(): React.JSX.Element {
  return (
    <Drawer
      trigger={
        <Button type="button" variant="secondary">
          Sort
        </Button>
      }
      title="Sort"
    >
      {null}
    </Drawer>
  );
}
