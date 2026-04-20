import { useState, useEffect } from "react";

const STORAGE_KEY = "sidebarOpen";

function readFromStorage(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "false") return false;
    if (raw === "true") return true;
    return true;
  } catch {
    return true;
  }
}

export function useSidebarOpen(): [boolean, () => void] {
  const [open, setOpen] = useState<boolean>(readFromStorage);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(open));
  }, [open]);

  const toggle = () => setOpen((prev) => !prev);

  return [open, toggle];
}
