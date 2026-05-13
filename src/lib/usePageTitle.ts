import { useEffect } from "react";

export function usePageTitle(title: string | undefined): void {
  useEffect(() => {
    if (!title) {
      return;
    }
    document.title = title;
    return (): void => {
      document.title = "Gen Con Buddy";
    };
  }, [title]);
}
