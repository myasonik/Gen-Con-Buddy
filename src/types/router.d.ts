import "@tanstack/history";

declare module "@tanstack/history" {
  interface HistoryState {
    from?: string;
  }
}
