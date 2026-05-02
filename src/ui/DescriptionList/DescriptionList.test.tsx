import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { DescriptionList, DescriptionItem } from "./DescriptionList";

test("renders a dl element", () => {
  render(
    <DescriptionList>
      <DescriptionItem term="Label">Value</DescriptionItem>
    </DescriptionList>,
  );
  expect(screen.getByRole("term")).toBeInTheDocument();
  expect(screen.getByRole("definition")).toBeInTheDocument();
});

test("DescriptionItem renders term and value", () => {
  render(
    <DescriptionList>
      <DescriptionItem term="Label">Value</DescriptionItem>
    </DescriptionList>,
  );
  expect(screen.getByRole("term")).toHaveTextContent("Label");
  expect(screen.getByRole("definition")).toHaveTextContent("Value");
});

test('DescriptionItem with span="full" has full class', () => {
  const { container } = render(
    <DescriptionList>
      <DescriptionItem term="Label" span="full">
        Value
      </DescriptionItem>
    </DescriptionList>,
  );
  const dl = container.querySelector("dl");
  const firstDiv = dl?.firstElementChild as HTMLElement;
  expect(firstDiv?.dataset?.["span"]).toBe("full");
});

test('DescriptionItem without span="full" does not have full class', () => {
  const { container } = render(
    <DescriptionList>
      <DescriptionItem term="Label">Value</DescriptionItem>
    </DescriptionList>,
  );
  const dl = container.querySelector("dl");
  const firstDiv = dl?.firstElementChild as HTMLElement;
  expect(firstDiv?.dataset?.["span"]).toBeUndefined();
});

test("shows empty state when children is null", () => {
  render(
    <DescriptionList>
      <DescriptionItem term="Label">{null}</DescriptionItem>
    </DescriptionList>,
  );
  expect(screen.getByRole("definition")).toHaveTextContent("not available");
});

test("shows empty state when children is undefined", () => {
  render(
    <DescriptionList>
      <DescriptionItem term="Label">{undefined}</DescriptionItem>
    </DescriptionList>,
  );
  expect(screen.getByRole("definition")).toHaveTextContent("not available");
});

test("shows empty state when children is empty string", () => {
  render(
    <DescriptionList>
      <DescriptionItem term="Label" />
    </DescriptionList>,
  );
  expect(screen.getByRole("definition")).toHaveTextContent("not available");
});

test("does not show empty state when children has content", () => {
  render(
    <DescriptionList>
      <DescriptionItem term="Label">Some value</DescriptionItem>
    </DescriptionList>,
  );
  const dd = screen.getByRole("definition");
  expect(dd).toHaveTextContent("Some value");
  expect(dd).not.toHaveTextContent("not available");
});

test("does not show empty state when children is the number 0", () => {
  render(
    <DescriptionList>
      <DescriptionItem term="Label">{0}</DescriptionItem>
    </DescriptionList>,
  );
  const dd = screen.getByRole("definition");
  expect(dd).toHaveTextContent("0");
  expect(dd).not.toHaveTextContent("not available");
});
