import type { Meta, StoryObj } from "@storybook/react-vite";
import { ActiveFilters } from "./ActiveFilters";

const meta = {
  title: "UI/ActiveFilters",
  component: ActiveFilters,
  tags: ["autodocs"],
  args: {
    onRemove: (): void => {},
    searchParams: {},
  },
} satisfies Meta<typeof ActiveFilters>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleFilter: Story = {
  args: {
    searchParams: { filter: "dragon" },
  },
};

export const MultipleFilters: Story = {
  args: {
    searchParams: {
      filter: "dragon",
      eventType: "RPG",
      days: "fri,sat",
    },
  },
};

export const DateAndRangeFilters: Story = {
  args: {
    searchParams: {
      startDateTime: "[2025-08-07,2025-08-09]",
      duration: "[2,4]",
      cost: "[0,10]",
    },
  },
};

export const NoFilters: Story = {
  args: {
    searchParams: {},
  },
};
