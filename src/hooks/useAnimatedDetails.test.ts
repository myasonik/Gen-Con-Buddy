import { expect, test, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAnimatedDetails } from "./useAnimatedDetails";

function makeDetails(open: boolean): {
  details: HTMLDetailsElement;
  summary: HTMLElement;
  div: HTMLDivElement;
} {
  const details = document.createElement("details");
  if (open) {
    details.open = true;
  }
  const summary = document.createElement("summary");
  const div = document.createElement("div");
  details.appendChild(summary);
  details.appendChild(div);
  document.body.appendChild(details);
  return { details, summary, div };
}

function makeEvent(): {
  event: React.MouseEvent<HTMLElement>;
  preventDefaultSpy: ReturnType<typeof vi.spyOn>;
} {
  const event = new MouseEvent("click", { bubbles: true, cancelable: true });
  const preventDefaultSpy = vi.spyOn(event, "preventDefault");
  return { event: event as unknown as React.MouseEvent<HTMLElement>, preventDefaultSpy };
}

test("intercepts click on closed details and initiates open animation", () => {
  const { result } = renderHook(() => useAnimatedDetails());
  const { details, div } = makeDetails(false);
  (result.current.ref as React.MutableRefObject<HTMLDetailsElement>).current = details;
  (result.current.contentRef as React.MutableRefObject<HTMLDivElement>).current = div;

  const { event, preventDefaultSpy } = makeEvent();
  result.current.onSummaryClick(event);

  expect(preventDefaultSpy).toHaveBeenCalledTimes(1);
  expect(details.open).toBe(true);
  expect(details.classList.contains("is-animating")).toBe(true);
  expect(details.classList.contains("is-closing")).toBe(false);
  expect(details.classList.contains("is-opening")).toBe(false); // added and removed synchronously
  details.remove();
});

test("adds is-animating on open click and removes after transitionend", () => {
  const { result } = renderHook(() => useAnimatedDetails());
  const { details, div } = makeDetails(false);
  (result.current.ref as React.MutableRefObject<HTMLDetailsElement>).current = details;
  (result.current.contentRef as React.MutableRefObject<HTMLDivElement>).current = div;

  result.current.onSummaryClick(makeEvent().event);

  expect(details.classList.contains("is-animating")).toBe(true);
  expect(details.classList.contains("is-closing")).toBe(false);

  div.dispatchEvent(new Event("transitionend"));

  expect(details.classList.contains("is-animating")).toBe(false);
  details.remove();
});

test("intercepts click on open details and adds is-closing + is-animating", () => {
  const { result } = renderHook(() => useAnimatedDetails());
  const { details, div } = makeDetails(true);
  (result.current.ref as React.MutableRefObject<HTMLDetailsElement>).current = details;
  (result.current.contentRef as React.MutableRefObject<HTMLDivElement>).current = div;

  const { event, preventDefaultSpy } = makeEvent();
  result.current.onSummaryClick(event);

  expect(preventDefaultSpy).toHaveBeenCalledTimes(1);
  expect(details.classList.contains("is-closing")).toBe(true);
  expect(details.classList.contains("is-animating")).toBe(true);
  expect(details.open).toBe(true);
  details.remove();
});

test("removes is-closing + is-animating and closes details after transitionend", () => {
  const { result } = renderHook(() => useAnimatedDetails());
  const { details, div } = makeDetails(true);
  (result.current.ref as React.MutableRefObject<HTMLDetailsElement>).current = details;
  (result.current.contentRef as React.MutableRefObject<HTMLDivElement>).current = div;

  result.current.onSummaryClick(makeEvent().event);
  div.dispatchEvent(new Event("transitionend"));

  expect(details.classList.contains("is-closing")).toBe(false);
  expect(details.classList.contains("is-animating")).toBe(false);
  expect(details.open).toBe(false);
  details.remove();
});

test("closes immediately when no content ref is present", () => {
  const { result } = renderHook(() => useAnimatedDetails());
  const details = document.createElement("details");
  details.open = true;
  details.appendChild(document.createElement("summary"));
  document.body.appendChild(details);
  (result.current.ref as React.MutableRefObject<HTMLDetailsElement>).current = details;

  result.current.onSummaryClick(makeEvent().event);

  expect(details.open).toBe(false);
  expect(details.classList.contains("is-animating")).toBe(false);
  details.remove();
});
