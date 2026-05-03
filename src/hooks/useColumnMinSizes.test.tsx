import { render, screen, waitFor } from "@testing-library/react";
import { useRef, useState } from "react";
import { expect, test, vi, beforeEach, afterEach } from "vitest";
import { makeEvent } from "../test/msw/factory";
import type { Event } from "../utils/types";
import { useColumnMinSizes } from "./useColumnMinSizes";

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    measureText: (text: string) => ({ width: text.length * 8 }),
    font: "",
  } as unknown as CanvasRenderingContext2D);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function TestTable({
  events,
  rows,
}: {
  events: Event[];
  rows: { colId: string; content: React.ReactNode }[][];
}): React.ReactElement {
  const tableRef = useRef<HTMLTableElement>(null);
  const minSizes = useColumnMinSizes(tableRef, events, {});
  return (
    <>
      <table ref={tableRef}>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map(({ colId, content }) => (
                <td key={colId} data-col-id={colId}>
                  {content}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div data-testid="result">{JSON.stringify(minSizes)}</div>
    </>
  );
}

test("measures the longest word per column across all rows", async () => {
  // "Wednesday" = 9 chars × 8 = 72; "Monday" = 6 chars × 8 = 48 → max = 72
  // jsdom reports 2px horizontal padding on <td> → min = 74
  render(
    <TestTable
      events={[makeEvent()]}
      rows={[[{ colId: "day", content: "Wednesday" }], [{ colId: "day", content: "Monday" }]]}
    />,
  );
  await waitFor(() => {
    const result = JSON.parse(screen.getByTestId("result").textContent ?? "");
    expect(result.day).toBe(74);
  });
});

test("uses longest word by char count, not full text", async () => {
  // "A short description" → longest word "description" = 11 chars × 8 = 88 + 2px jsdom padding = 90
  render(
    <TestTable
      events={[makeEvent()]}
      rows={[[{ colId: "desc", content: "A short description" }]]}
    />,
  );
  await waitFor(() => {
    const result = JSON.parse(screen.getByTestId("result").textContent ?? "");
    expect(result.desc).toBe(90);
  });
});

test("adds SVG width and gap to the minimum", async () => {
  // "Board" = 5 chars × 8 = 40; svg width = 14; gap fallback = 4; 2px jsdom padding → total = 60
  render(
    <TestTable
      events={[makeEvent()]}
      rows={[
        [
          {
            colId: "eventType",
            content: (
              <>
                <svg width="14" height="14" />
                Board Game
              </>
            ),
          },
        ],
      ]}
    />,
  );
  await waitFor(() => {
    const result = JSON.parse(screen.getByTestId("result").textContent ?? "");
    expect(result.eventType).toBe(60);
  });
});

test("returns {} when tableRef is null (not yet mounted)", () => {
  // useRef inside a component with no DOM element attached keeps current = null
  function NoTable(): React.ReactElement {
    const ref = useRef<HTMLTableElement>(null);
    const minSizes = useColumnMinSizes(ref, [makeEvent()], {});
    return <div data-testid="result">{JSON.stringify(minSizes)}</div>;
  }
  render(<NoTable />);
  expect(JSON.parse(screen.getByTestId("result").textContent ?? "")).toStrictEqual({});
});

test("returns {} when canvas context is unavailable", async () => {
  vi.restoreAllMocks();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  render(<TestTable events={[makeEvent()]} rows={[[{ colId: "day", content: "Wednesday" }]]} />);
  await waitFor(() => {
    const result = JSON.parse(screen.getByTestId("result").textContent ?? "");
    expect(result).toStrictEqual({});
  });
});

test("remeasures when visibility changes", async () => {
  const events = [makeEvent()];

  function VisibilityRerender(): React.ReactElement {
    const [showExtra, setShowExtra] = useState(false);
    const tableRef = useRef<HTMLTableElement>(null);
    const visibility: Record<string, boolean> = showExtra ? { extra: true } : {};
    const minSizes = useColumnMinSizes(tableRef, events, visibility);
    return (
      <>
        <table ref={tableRef}>
          <tbody>
            <tr>
              <td data-col-id="day">Wednesday</td>
              {showExtra && <td data-col-id="extra">Longword</td>}
            </tr>
          </tbody>
        </table>
        <div data-testid="result">{JSON.stringify(minSizes)}</div>
        <button type="button" onClick={() => setShowExtra(true)}>
          show extra
        </button>
      </>
    );
  }

  const user = (await import("@testing-library/user-event")).default.setup();
  render(<VisibilityRerender />);
  await waitFor(() => {
    const result = JSON.parse(screen.getByTestId("result").textContent ?? "");
    expect(result.day).toBe(74); // "Wednesday" = 9 × 8 + 2px jsdom padding
    expect(result.extra).toBeUndefined();
  });
  await user.click(screen.getByRole("button", { name: "show extra" }));
  await waitFor(() => {
    const result = JSON.parse(screen.getByTestId("result").textContent ?? "");
    expect(result.extra).toBe(66); // "Longword" = 8 × 8 + 2px jsdom padding
  });
});

test("remeasures when events change", async () => {
  const events1 = [makeEvent()];
  const events2 = [makeEvent()];

  function Rerender(): React.ReactElement {
    const [events, setEvents] = useState(events1);
    const tableRef = useRef<HTMLTableElement>(null);
    const minSizes = useColumnMinSizes(tableRef, events, {});
    return (
      <>
        <table ref={tableRef}>
          <tbody>
            <tr>
              <td data-col-id="day">{events === events1 ? "Monday" : "Wednesday"}</td>
            </tr>
          </tbody>
        </table>
        <div data-testid="result">{JSON.stringify(minSizes)}</div>
        <button type="button" onClick={() => setEvents(events2)}>
          next page
        </button>
      </>
    );
  }

  const user = (await import("@testing-library/user-event")).default.setup();
  render(<Rerender />);
  await waitFor(() => {
    expect(JSON.parse(screen.getByTestId("result").textContent ?? "").day).toBe(50); // "Monday" = 6 × 8 + 2px jsdom padding
  });
  await user.click(screen.getByRole("button", { name: "next page" }));
  await waitFor(() => {
    expect(JSON.parse(screen.getByTestId("result").textContent ?? "").day).toBe(74); // "Wednesday" = 9 × 8 + 2px jsdom padding
  });
});
