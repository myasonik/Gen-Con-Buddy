import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventTypeSelect } from "./EventTypeSelect";

test("renders the Event Type label and combobox input", () => {
  render(<EventTypeSelect value="" onValueChange={() => {}} />);
  expect(screen.getByRole("combobox", { name: "Event Type" })).toBeInTheDocument();
});

test("shows no chip remove buttons when value is empty", () => {
  render(<EventTypeSelect value="" onValueChange={() => {}} />);
  expect(screen.queryByRole("button", { name: /^Remove/ })).not.toBeInTheDocument();
});

test("shows short code chips for selected values when closed", () => {
  render(<EventTypeSelect value="RPG,BGM" onValueChange={() => {}} />);
  const rpgRemove = screen.getByRole("button", { name: "Remove RPG" });
  const bgmRemove = screen.getByRole("button", { name: "Remove BGM" });
  expect(rpgRemove.closest("[data-testid=chip]")).toHaveTextContent("RPG");
  expect(rpgRemove.closest("[data-testid=chip]")).not.toHaveTextContent("Role Playing Game");
  expect(bgmRemove.closest("[data-testid=chip]")).toHaveTextContent("BGM");
  expect(bgmRemove.closest("[data-testid=chip]")).not.toHaveTextContent("Board Game");
});

test("chips expand to show full name when dropdown is open", async () => {
  const user = userEvent.setup();
  render(<EventTypeSelect value="RPG" onValueChange={() => {}} />);

  await user.click(screen.getByRole("combobox", { name: "Event Type" }));

  const rpgRemove = screen.getByRole("button", { name: "Remove RPG" });
  const chip = rpgRemove.closest("[data-testid=chip]");
  expect(chip).toHaveTextContent("RPG");
  expect(chip).toHaveTextContent("Role Playing Game");
});

test("selecting an option calls onValueChange with that code", async () => {
  const user = userEvent.setup();
  const handleChange = vi.fn<(value: string) => void>();
  render(<EventTypeSelect value="" onValueChange={handleChange} />);

  await user.click(screen.getByRole("combobox", { name: "Event Type" }));
  await user.click(screen.getByRole("option", { name: /Board Game/ }));

  expect(handleChange).toHaveBeenCalledWith("BGM");
});

test("selecting a second option appends it to the value", async () => {
  const user = userEvent.setup();
  const handleChange = vi.fn<(value: string) => void>();
  render(<EventTypeSelect value="RPG" onValueChange={handleChange} />);

  await user.click(screen.getByRole("combobox", { name: "Event Type" }));
  await user.click(screen.getByRole("option", { name: /Board Game/ }));

  expect(handleChange).toHaveBeenCalledWith("RPG,BGM");
});

test("selecting an already-selected option removes it from the value", async () => {
  const user = userEvent.setup();
  const handleChange = vi.fn<(value: string) => void>();
  render(<EventTypeSelect value="RPG,BGM" onValueChange={handleChange} />);

  await user.click(screen.getByRole("combobox", { name: "Event Type" }));
  await user.click(screen.getByRole("option", { name: /Board Game/ }));

  expect(handleChange).toHaveBeenCalledWith("RPG");
});

test("filter text narrows options by code", async () => {
  const user = userEvent.setup();
  render(<EventTypeSelect value="" onValueChange={() => {}} />);

  await user.click(screen.getByRole("combobox", { name: "Event Type" }));
  await user.type(screen.getByRole("combobox", { name: "Event Type" }), "RPG");

  expect(screen.getByRole("option", { name: /Role Playing Game/ })).toBeInTheDocument();
  expect(screen.queryByRole("option", { name: /Board Game/ })).not.toBeInTheDocument();
});

test("filter text narrows options by name", async () => {
  const user = userEvent.setup();
  render(<EventTypeSelect value="" onValueChange={() => {}} />);

  await user.click(screen.getByRole("combobox", { name: "Event Type" }));
  await user.type(screen.getByRole("combobox", { name: "Event Type" }), "mini");

  expect(screen.getByRole("option", { name: "Historical Miniatures" })).toBeInTheDocument();
  expect(screen.queryByRole("option", { name: /Board Game/ })).not.toBeInTheDocument();
});

test("filter text is cleared when dropdown closes", async () => {
  const user = userEvent.setup();
  render(<EventTypeSelect value="" onValueChange={() => {}} />);

  await user.click(screen.getByRole("combobox", { name: "Event Type" }));
  await user.type(screen.getByRole("combobox", { name: "Event Type" }), "RPG");
  expect(screen.queryByRole("option", { name: /Board Game/ })).not.toBeInTheDocument();

  // Close the dropdown by pressing Escape
  await user.keyboard("{Escape}");

  // Reopen — all options should be visible again (filter was reset)
  await user.click(screen.getByRole("combobox", { name: "Event Type" }));
  expect(screen.getByRole("option", { name: /Board Game/ })).toBeInTheDocument();
});

test("removing a chip calls onValueChange without that code", async () => {
  const user = userEvent.setup();
  const handleChange = vi.fn<(value: string) => void>();
  render(<EventTypeSelect value="RPG,BGM" onValueChange={handleChange} />);

  await user.click(screen.getByRole("button", { name: "Remove RPG" }));

  expect(handleChange).toHaveBeenCalledWith("BGM");
});

test("dropdown opens when Tab moves focus into the input", async () => {
  const user = userEvent.setup();
  render(
    <>
      <button type="button">Previous element</button>
      <EventTypeSelect value="" onValueChange={() => {}} />
    </>,
  );

  await user.click(screen.getByRole("button", { name: "Previous element" }));
  await user.tab();

  expect(screen.getByRole("option", { name: /Board Game/ })).toBeInTheDocument();
});

test("pills expand to show full name when Tab moves focus into the input", async () => {
  const user = userEvent.setup();
  render(
    <>
      <button type="button">Previous element</button>
      <EventTypeSelect value="RPG" onValueChange={() => {}} />
    </>,
  );

  await user.click(screen.getByRole("button", { name: "Previous element" }));
  await user.tab(); // → Remove RPG chip button
  await user.tab(); // → input

  const chip = screen.getByTestId("chip");
  expect(chip).toHaveTextContent("Role Playing Game");
});

test("pills expand to show full name when Tab moves focus onto a chip button", async () => {
  const user = userEvent.setup();
  render(
    <>
      <button type="button">Previous element</button>
      <EventTypeSelect value="RPG" onValueChange={() => {}} />
    </>,
  );

  await user.click(screen.getByRole("button", { name: "Previous element" }));
  await user.tab(); // → Remove RPG chip button (first tab stop in the component)

  const chip = screen.getByTestId("chip");
  expect(chip).toHaveTextContent("Role Playing Game");
});

test("dropdown closes when Tab moves focus out of the component", async () => {
  const user = userEvent.setup();
  render(
    <>
      <EventTypeSelect value="" onValueChange={() => {}} />
      <button type="button">Next element</button>
    </>,
  );

  await user.click(screen.getByRole("combobox", { name: "Event Type" }));
  expect(screen.getByRole("option", { name: /Board Game/ })).toBeInTheDocument();

  await user.tab();

  expect(screen.queryByRole("option", { name: /Board Game/ })).not.toBeInTheDocument();
});

test("selected chip renders an icon alongside the code", () => {
  render(<EventTypeSelect value="RPG" onValueChange={() => {}} />);
  const chip = screen.getByTestId("chip");
  expect(chip.querySelector("svg")).not.toBeNull();
});

test("dropdown list items render an icon for each option", async () => {
  const user = userEvent.setup();
  render(<EventTypeSelect value="" onValueChange={() => {}} />);
  await user.click(screen.getByRole("combobox", { name: "Event Type" }));
  const [firstOption] = screen.getAllByRole("option");
  expect(firstOption.querySelector("svg")).not.toBeNull();
});

test("two mounted EventTypeSelect instances have distinct input ids", () => {
  render(
    <>
      <EventTypeSelect value="" onValueChange={() => undefined} />
      <EventTypeSelect value="" onValueChange={() => undefined} />
    </>,
  );
  const inputs = screen.getAllByRole("combobox");
  expect(inputs[0].id).not.toBe("");
  expect(inputs[1].id).not.toBe("");
  expect(inputs[0].id).not.toBe(inputs[1].id);
});
