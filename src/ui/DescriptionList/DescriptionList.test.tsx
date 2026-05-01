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
