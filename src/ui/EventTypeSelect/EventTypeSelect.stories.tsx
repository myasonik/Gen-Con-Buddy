import type { Meta, StoryObj } from "@storybook/react-vite";
import { EventTypeSelect } from "./EventTypeSelect";

const meta = {
  title: "UI/EventTypeSelect",
  component: EventTypeSelect,
  tags: ["autodocs"],
  args: {
    value: "",
    onValueChange: (): void => {},
  },
} satisfies Meta<typeof EventTypeSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const SingleSelection: Story = {
  args: { value: "RPG" },
};

export const MultipleSelections: Story = {
  args: { value: "RPG,BGM,CGM" },
};
