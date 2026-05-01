import { useState } from "react";

export function useSidebarOpen(): [boolean, () => void] {
  const [open, setOpen] = useState(false);
  const toggle = (): void => setOpen((prev) => !prev);
  return [open, toggle];
}
