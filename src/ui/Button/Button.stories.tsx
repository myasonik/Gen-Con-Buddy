import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, BUTTON_VARIANTS } from "./Button";
import { makeMatrix } from "../storyMatrix";

const meta = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  args: {
    children: "Button",
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { variant: "primary" },
};

export const Secondary: Story = {
  args: { variant: "secondary" },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const SubmitType: Story = {
  args: { type: "submit", children: "▶ Search" },
};

const { stories, Grid } = makeMatrix(
  meta,
  { variant: BUTTON_VARIANTS, disabled: [false, true] },
  { children: "Button" },
);

export const AllVariants: Story = { render: Grid };

export const { primary_false, primary_true, secondary_false, secondary_true } =
  stories;
