import type { Meta, StoryObj } from "@storybook/react-vite";
import { ToggleTile } from "./ToggleTile";
import { makeMatrix } from "../storyMatrix";

const meta = {
  title: "UI/ToggleTile",
  component: ToggleTile,
  tags: ["autodocs"],
  args: { children: "Fri" },
} satisfies Meta<typeof ToggleTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unselected: Story = {
  args: { defaultPressed: false },
};

export const Selected: Story = {
  args: { pressed: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const DisabledSelected: Story = {
  args: { pressed: true, disabled: true },
};

const { Grid } = makeMatrix(
  meta,
  { pressed: [false, true], disabled: [false, true] },
  { children: "Fri" },
);

export const AllVariants: Story = { render: Grid };
