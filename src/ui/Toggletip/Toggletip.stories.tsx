import type { Meta, StoryObj } from "@storybook/react-vite";
import { Toggletip } from "./Toggletip";

const meta = {
  title: "UI/Toggletip",
  component: Toggletip,
  tags: ["autodocs"],
  args: {
    label: "Why is this disabled?",
    message: "Clear the day checkboxes above to use custom date fields.",
  },
} satisfies Meta<typeof Toggletip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongMessage: Story = {
  args: {
    message:
      "Results are capped at 10,000 events. Narrow your search to see more pages.",
  },
};
