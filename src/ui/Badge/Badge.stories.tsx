import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge, BoolBadge, BADGE_VARIANTS } from "./Badge";
import { makeMatrix } from "../storyMatrix";

const meta = {
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: { children: "ticketed" },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Filled: Story = {
  args: { variant: "filled", children: "ticketed" },
};

export const Outline: Story = {
  args: { variant: "outline", children: "free" },
};

const { stories, Grid } = makeMatrix(
  meta,
  { variant: BADGE_VARIANTS },
  { children: "ticketed" },
);

export const AllVariants: Story = { render: Grid };

export const BoolTrue: StoryObj = {
  render: () => <BoolBadge value={true} />,
};

export const BoolFalse: StoryObj = {
  render: () => <BoolBadge value={false} />,
};
