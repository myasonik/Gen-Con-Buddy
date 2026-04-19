import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { announce, __reset } from "./announce";

function setupNodes() {
  const polite = document.createElement("div");
  polite.id = "live-polite";
  const assertive = document.createElement("div");
  assertive.id = "live-assertive";
  document.body.appendChild(polite);
  document.body.appendChild(assertive);
  return { polite, assertive };
}

describe("announce", () => {
  let polite: HTMLDivElement;
  let assertive: HTMLDivElement;

  beforeEach(() => {
    const nodes = setupNodes();
    polite = nodes.polite as HTMLDivElement;
    assertive = nodes.assertive as HTMLDivElement;
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.getElementById("live-polite")?.remove();
    document.getElementById("live-assertive")?.remove();
    __reset();
    vi.useRealTimers();
  });

  it("sets textContent on #live-polite by default", async () => {
    announce("hello");
    await vi.runAllTimersAsync();
    expect(polite.textContent).toBe("hello");
  });

  it("sets textContent on #live-assertive when priority is assertive", async () => {
    announce("urgent", "assertive");
    await vi.runAllTimersAsync();
    expect(assertive.textContent).toBe("urgent");
  });

  it("clears textContent before setting it", async () => {
    announce("hello");
    // textContent is cleared synchronously on the first tick
    expect(polite.textContent).toBe("");
    await vi.runAllTimersAsync();
    expect(polite.textContent).toBe("hello");
  });

  it("processes queued messages in order", async () => {
    announce("first");
    announce("second");
    await vi.runAllTimersAsync();
    expect(polite.textContent).toBe("second");
  });

  it("does not throw when the target node is missing", () => {
    document.getElementById("live-polite")?.remove();
    expect(() => announce("hello")).not.toThrow();
  });

  it("continues draining to a working node after a missing-node entry is skipped", async () => {
    document.getElementById("live-polite")?.remove();
    announce("dropped", "polite");
    announce("delivered", "assertive");
    await vi.runAllTimersAsync();
    expect(assertive.textContent).toBe("delivered");
  });

  it("__reset prevents queued-but-not-yet-written messages from being delivered", async () => {
    announce("first");
    announce("second");
    announce("third");
    __reset();
    await vi.runAllTimersAsync();
    expect(polite.textContent).not.toBe("second");
    expect(polite.textContent).not.toBe("third");
  });

  it("__reset allows a fresh announcement to be delivered afterward", async () => {
    announce("stale");
    __reset();
    announce("fresh");
    await vi.runAllTimersAsync();
    expect(polite.textContent).toBe("fresh");
  });
});
