import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

type AxisValues = Record<string, readonly unknown[]>;

type Combo<T extends AxisValues> = {
  [K in keyof T]: T[K][number];
};

export function cartesian<T extends AxisValues>(axes: T): Combo<T>[] {
  const keys = Object.keys(axes);
  let result: Partial<Combo<T>>[] = [{}];

  for (const key of keys) {
    const next: Partial<Combo<T>>[] = [];
    for (const combo of result) {
      for (const val of axes[key]) {
        next.push({ ...combo, [key]: val });
      }
    }
    result = next;
  }

  return result as Combo<T>[];
}

export function makeMatrix<TMeta extends Meta<any>>(
  meta: TMeta,
  axes: AxisValues,
  defaults?: Record<string, unknown>,
): {
  stories: Record<string, StoryObj<TMeta>>;
  Grid: () => React.JSX.Element;
} {
  const combos = cartesian(axes);
  if (!meta.component)
    throw new Error("makeMatrix requires meta.component to be defined");
  const Component = meta.component as React.ComponentType<
    Record<string, unknown>
  >;

  const stories: Record<string, StoryObj<TMeta>> = {};
  for (const combo of combos) {
    const vals = Object.values(combo).map(String);
    const key = vals.join("_");
    const name = vals.join(" / ");
    stories[key] = {
      name,
      args: { ...defaults, ...combo } as StoryObj<TMeta>["args"],
    };
  }

  function Grid() {
    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1.5rem",
          padding: "1rem",
        }}
      >
        {combos.map((combo) => {
          const key = Object.values(combo).map(String).join("_");
          const label = Object.entries(combo)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ");
          return (
            <div
              key={key}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                alignItems: "flex-start",
              }}
            >
              <Component {...defaults} {...combo} />
              <span
                style={{
                  fontSize: "var(--text-small)",
                  color: "var(--color-bark-light)",
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return { stories, Grid };
}
