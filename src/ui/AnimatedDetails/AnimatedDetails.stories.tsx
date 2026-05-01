import type { Meta, StoryObj } from "@storybook/react-vite";
import { AnimatedDetails } from "./AnimatedDetails";

const meta = {
  title: "UI/AnimatedDetails",
  component: AnimatedDetails,
  tags: ["autodocs"],
  args: {
    summary: "Toggle details",
    children: "This is the expandable content.",
  },
} satisfies Meta<typeof AnimatedDetails>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const StartOpen: Story = {
  args: { open: true },
};

export const RichSummary: Story = {
  args: {
    open: true,
    summary: (
      <span>
        <strong>12</strong> events &mdash; <em>click to collapse</em>
      </span>
    ),
  },
};

export const TallContent: Story = {
  args: {
    open: true,
    children: (
      <ul>
        {Array.from({ length: 12 }, (_, i) => (
          <li key={i}>Item {i + 1}</li>
        ))}
      </ul>
    ),
  },
};
