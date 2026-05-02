import type { Meta, StoryObj } from "@storybook/react-vite";
import { DescriptionList, DescriptionItem } from "./DescriptionList";

const meta = {
  title: "UI/DescriptionList",
  component: DescriptionList,
  tags: ["autodocs"],
  args: {
    children: <DescriptionItem term="Game System">D&amp;D 5e</DescriptionItem>,
  },
} satisfies Meta<typeof DescriptionList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <DescriptionItem term="Game System">Dungeons &amp; Dragons 5e</DescriptionItem>
        <DescriptionItem term="Experience Required">None</DescriptionItem>
        <DescriptionItem term="Min / Max Players">2 / 6</DescriptionItem>
        <DescriptionItem term="Duration">4 hours</DescriptionItem>
      </>
    ),
  },
};

export const WithFullSpanItem: Story = {
  args: {
    children: (
      <>
        <DescriptionItem term="Title">The Lost Mines of Phandelver</DescriptionItem>
        <DescriptionItem term="Game System">D&amp;D 5e</DescriptionItem>
        <DescriptionItem term="Duration">4 hours</DescriptionItem>
        <DescriptionItem term="Description" span="full">
          A classic adventure for new and experienced players alike. Explore the village of
          Phandalin and recover the lost mine from the clutches of evil.
        </DescriptionItem>
      </>
    ),
  },
};
