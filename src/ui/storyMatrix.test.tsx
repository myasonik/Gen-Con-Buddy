import { describe, it, expect } from "vitest";
import React from "react";
import { cartesian, makeMatrix } from "./storyMatrix";
import type { Meta } from "@storybook/react-vite";

const StubComponent = ({ children }: { children?: React.ReactNode }) => (
  <button type="button">{children}</button>
);

describe("cartesian", () => {
  it("produces all combinations of two axes", () => {
    const result = cartesian({
      variant: ["a", "b"] as const,
      size: ["sm", "md"] as const,
    });
    expect(result).toHaveLength(4);
    expect(result).toContainEqual({ variant: "a", size: "sm" });
    expect(result).toContainEqual({ variant: "a", size: "md" });
    expect(result).toContainEqual({ variant: "b", size: "sm" });
    expect(result).toContainEqual({ variant: "b", size: "md" });
  });

  it("returns a single empty object for empty axes", () => {
    expect(cartesian({})).toEqual([{}]);
  });

  it("handles a single axis", () => {
    expect(cartesian({ variant: ["x", "y"] as const })).toEqual([
      { variant: "x" },
      { variant: "y" },
    ]);
  });

  it("produces the correct count for three axes", () => {
    const result = cartesian({
      a: [1, 2] as const,
      b: ["x", "y"] as const,
      c: [true, false] as const,
    });
    expect(result).toHaveLength(8);
    expect(result).toContainEqual({ a: 1, b: "x", c: true });
  });
});

describe("makeMatrix", () => {
  const meta = { component: StubComponent } satisfies Meta<
    typeof StubComponent
  >;

  it("returns one story per combination", () => {
    const { stories } = makeMatrix(meta, {
      variant: ["primary", "secondary"] as const,
      size: ["sm", "md"] as const,
    });
    expect(Object.keys(stories)).toHaveLength(4);
  });

  it("keys stories by underscore-joined values", () => {
    const { stories } = makeMatrix(meta, {
      variant: ["primary"] as const,
      size: ["md"] as const,
    });
    expect(stories).toHaveProperty("primary_md");
  });

  it("sets a human-readable name on each story", () => {
    const { stories } = makeMatrix(meta, {
      variant: ["primary"] as const,
      size: ["md"] as const,
    });
    expect(stories["primary_md"].name).toBe("primary / md");
  });

  it("merges defaults into story args", () => {
    const { stories } = makeMatrix(
      meta,
      { variant: ["primary"] as const },
      { children: "Click me" },
    );
    expect(stories["primary"].args).toMatchObject({
      children: "Click me",
      variant: "primary",
    });
  });

  it("returns a Grid render function", () => {
    const { Grid } = makeMatrix(meta, { variant: ["primary"] as const });
    expect(typeof Grid).toBe("function");
  });

  it("throws when meta.component is undefined", () => {
    expect(() =>
      makeMatrix({} as Meta<any>, { variant: ["x"] as const }),
    ).toThrow("makeMatrix requires meta.component to be defined");
  });
});
