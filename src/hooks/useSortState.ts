import { getSortField, getColId } from "../components/EventTable/columns";

interface UseSortStateOptions {
  activeSortField: string | undefined;
  activeSortDir: "asc" | "desc" | undefined;
  onSort: (field: string, dir: "asc" | "desc") => void;
}

interface UseSortStateResult {
  handleColumnClick: (colId: string) => void;
  activeColId: string | undefined;
  activeSortDir: "asc" | "desc" | undefined;
}

export function useSortState({
  activeSortField,
  activeSortDir,
  onSort,
}: UseSortStateOptions): UseSortStateResult {
  let activeColId: string | undefined = undefined;
  if (activeSortField !== undefined) {
    try {
      activeColId = getColId(activeSortField);
    } catch {
      activeColId = undefined;
    }
  }

  const handleColumnClick = (colId: string): void => {
    const field = getSortField(colId);
    if (field === activeSortField) {
      onSort(field, activeSortDir === "asc" ? "desc" : "asc");
    } else {
      onSort(field, "asc");
    }
  };

  return { handleColumnClick, activeColId, activeSortDir };
}
