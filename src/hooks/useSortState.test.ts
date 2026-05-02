import { expect, describe, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSortState } from "./useSortState";

describe("useSortState", () => {
  it("returns undefined activeColId when no active sort", () => {
    const { result } = renderHook(() =>
      useSortState({
        activeSortField: undefined,
        activeSortDir: undefined,
        onSort: vi.fn<(field: string, dir: "asc" | "desc") => void>(),
      }),
    );
    expect(result.current.activeColId).toBeUndefined();
    expect(result.current.activeSortDir).toBeUndefined();
  });

  it("derives activeColId from activeSortField", () => {
    const { result } = renderHook(() =>
      useSortState({
        activeSortField: "title",
        activeSortDir: "asc",
        onSort: vi.fn<(field: string, dir: "asc" | "desc") => void>(),
      }),
    );
    expect(result.current.activeColId).toBe("title");
    expect(result.current.activeSortDir).toBe("asc");
  });

  it("derives activeColId for startDateTime (maps to startDateTime col)", () => {
    const { result } = renderHook(() =>
      useSortState({
        activeSortField: "startDateTime",
        activeSortDir: "desc",
        onSort: vi.fn<(field: string, dir: "asc" | "desc") => void>(),
      }),
    );
    expect(result.current.activeColId).toBe("startDateTime");
    expect(result.current.activeSortDir).toBe("desc");
  });

  it("clicking a new column calls onSort with asc direction", () => {
    const onSort = vi.fn<(field: string, dir: "asc" | "desc") => void>();
    const { result } = renderHook(() =>
      useSortState({
        activeSortField: undefined,
        activeSortDir: undefined,
        onSort,
      }),
    );
    act(() => {
      result.current.handleColumnClick("title");
    });
    expect(onSort).toHaveBeenCalledWith("title", "asc");
  });

  it("clicking the active column ascending toggles to desc", () => {
    const onSort = vi.fn<(field: string, dir: "asc" | "desc") => void>();
    const { result } = renderHook(() =>
      useSortState({
        activeSortField: "title",
        activeSortDir: "asc",
        onSort,
      }),
    );
    act(() => {
      result.current.handleColumnClick("title");
    });
    expect(onSort).toHaveBeenCalledWith("title", "desc");
  });

  it("clicking the active column descending toggles to asc", () => {
    const onSort = vi.fn<(field: string, dir: "asc" | "desc") => void>();
    const { result } = renderHook(() =>
      useSortState({
        activeSortField: "title",
        activeSortDir: "desc",
        onSort,
      }),
    );
    act(() => {
      result.current.handleColumnClick("title");
    });
    expect(onSort).toHaveBeenCalledWith("title", "asc");
  });

  it("switching to a different column always starts with asc", () => {
    const onSort = vi.fn<(field: string, dir: "asc" | "desc") => void>();
    const { result } = renderHook(() =>
      useSortState({
        activeSortField: "title",
        activeSortDir: "desc",
        onSort,
      }),
    );
    act(() => {
      result.current.handleColumnClick("gameId");
    });
    expect(onSort).toHaveBeenCalledWith("gameId", "asc");
  });

  it("uses getSortField to map colId to field when calling onSort", () => {
    const onSort = vi.fn<(field: string, dir: "asc" | "desc") => void>();
    const { result } = renderHook(() =>
      useSortState({
        activeSortField: undefined,
        activeSortDir: undefined,
        onSort,
      }),
    );
    act(() => {
      result.current.handleColumnClick("day");
    });
    expect(onSort).toHaveBeenCalledWith("startDateTime", "asc");
  });
});
