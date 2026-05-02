import type { Meta, StoryObj } from "@storybook/react-vite";
import { Field, RangeField } from "./Field";

const meta = {
  title: "UI/Field",
  component: Field,
  tags: ["autodocs"],
  args: {
    label: "Label",
    children: <input type="text" />,
  },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextInput: Story = {
  args: {
    label: "Game System",
    children: <input type="text" placeholder="e.g. D&amp;D 5e" />,
  },
};

export const NumberInput: Story = {
  args: {
    label: "Min Players",
    children: <input type="number" min={1} />,
  },
};

export const RangeFieldStory: Story = {
  name: "RangeField",
  args: {
    label: "Duration",
    children: <input type="number" />,
  },
  render: () => (
    <RangeField label="Duration">
      {[<input key="from" type="number" min={0} />, <input key="to" type="number" min={0} />]}
    </RangeField>
  ),
};

export const RangeFieldStacked: Story = {
  name: "RangeField (stacked)",
  args: {
    label: "Date Range",
    children: <input type="date" />,
  },
  render: () => (
    <RangeField label="Date Range" stack>
      {[<input key="from" type="date" />, <input key="to" type="date" />]}
    </RangeField>
  ),
};
