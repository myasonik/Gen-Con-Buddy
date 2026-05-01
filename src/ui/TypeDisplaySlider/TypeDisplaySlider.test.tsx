import { expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { TypeDisplay } from "../../hooks/useTypeDisplay";
import { TypeDisplaySlider } from "./TypeDisplaySlider";

test("renders a slider with aria-label 'Type display'", () => {
  render(<TypeDisplaySlider value="both" onChange={vi.fn<(value: TypeDisplay) => void>()} />);
  expect(screen.getByRole("slider", { name: "Type display" })).toBeInTheDocument();
});

test("slider value is 0 when prop is 'code'", () => {
  render(<TypeDisplaySlider value="code" onChange={vi.fn<(value: TypeDisplay) => void>()} />);
  expect(screen.getByRole("slider")).toHaveValue("0");
});

test("slider value is 1 when prop is 'name'", () => {
  render(<TypeDisplaySlider value="name" onChange={vi.fn<(value: TypeDisplay) => void>()} />);
  expect(screen.getByRole("slider")).toHaveValue("1");
});

test("slider value is 2 when prop is 'both'", () => {
  render(<TypeDisplaySlider value="both" onChange={vi.fn<(value: TypeDisplay) => void>()} />);
  expect(screen.getByRole("slider")).toHaveValue("2");
});

test("calls onChange with 'code' when moved to position 0", () => {
  const onChange = vi.fn<(value: TypeDisplay) => void>();
  render(<TypeDisplaySlider value="both" onChange={onChange} />);
  fireEvent.change(screen.getByRole("slider"), { target: { value: "0" } });
  expect(onChange).toHaveBeenCalledWith("code");
});

test("calls onChange with 'name' when moved to position 1", () => {
  const onChange = vi.fn<(value: TypeDisplay) => void>();
  render(<TypeDisplaySlider value="both" onChange={onChange} />);
  fireEvent.change(screen.getByRole("slider"), { target: { value: "1" } });
  expect(onChange).toHaveBeenCalledWith("name");
});

test("calls onChange with 'both' when moved to position 2", () => {
  const onChange = vi.fn<(value: TypeDisplay) => void>();
  render(<TypeDisplaySlider value="code" onChange={onChange} />);
  fireEvent.change(screen.getByRole("slider"), { target: { value: "2" } });
  expect(onChange).toHaveBeenCalledWith("both");
});

test("renders visible labels Code, Name, Both", () => {
  render(<TypeDisplaySlider value="both" onChange={vi.fn<(value: TypeDisplay) => void>()} />);
  expect(screen.getByText("Code")).toBeInTheDocument();
  expect(screen.getByText("Name")).toBeInTheDocument();
  expect(screen.getByText("Both")).toBeInTheDocument();
});
