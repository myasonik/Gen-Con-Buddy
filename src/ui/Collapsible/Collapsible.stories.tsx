import type { Meta, StoryObj } from "@storybook/react-vite";
import { Collapsible } from "./Collapsible";

const meta = {
  title: "UI/Collapsible",
  component: Collapsible,
  tags: ["autodocs"],
  args: {
    trigger: "Toggle details",
    children: "This is the expandable content.",
  },
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const StartOpen: Story = {
  args: { open: true },
};

export const RichTrigger: Story = {
  args: {
    open: true,
    trigger: (
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
