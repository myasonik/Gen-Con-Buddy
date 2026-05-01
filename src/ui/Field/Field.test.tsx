import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Field, RangeField } from "./Field";

test("Field wires label to input via id", () => {
  render(
    <Field label="Game ID">
      <input type="text" />
    </Field>,
  );
  const input = screen.getByRole("textbox");
  const label = screen.getByText("Game ID");
  expect(label.tagName).toBe("LABEL");
  expect(label).toHaveAttribute("for", input.id);
  expect(input.id).not.toBe("");
});

test("RangeField renders two inputs and a group label", () => {
  render(
    <RangeField label="Duration (hours)">
      <input type="number" aria-label="from" />
      <input type="number" aria-label="to" />
    </RangeField>,
  );
  expect(screen.getByText("Duration (hours)")).toBeInTheDocument();
  expect(screen.getAllByRole("spinbutton")).toHaveLength(2);
});
