import type { Meta, StoryObj } from "@storybook/react-vite";
import { Select } from "./Select";

const OPTIONS = [
  { value: "rpg", label: "Role Playing Game" },
  { value: "board", label: "Board Game" },
  { value: "card", label: "Card Game" },
  { value: "miniature", label: "Miniature Game" },
];

const meta = {
  title: "UI/Select",
  component: Select,
  tags: ["autodocs"],
  args: {
    options: OPTIONS,
    value: "",
    onValueChange: (): void => {},
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithPlaceholder: Story = {
  args: { placeholder: "Any game type" },
};

export const Selected: Story = {
  args: { value: "rpg" },
};

export const WithAriaLabel: Story = {
  args: { "aria-label": "Game type" },
};
