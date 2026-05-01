import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmptyState } from "./EmptyState";

const meta = {
  title: "UI/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  args: { variant: "loading", text: "LOADING QUESTS..." },
};

export const Empty: Story = {
  args: {
    variant: "empty",
    text: "NO QUESTS FOUND",
    subtext: "Try broadening your search.",
  },
};

export const ErrorState: Story = {
  args: {
    variant: "error",
    text: "QUEST FAILED",
    subtext: "Unable to load events. Please try again.",
  },
};

export const NotFound: Story = {
  args: {
    variant: "empty",
    text: "EVENT NOT FOUND",
    subtext: "This quest does not exist.",
  },
};
