import type { Meta, StoryObj } from "@storybook/react-vite";
import { Meeple } from "./Meeple";
import { Meeple3D } from "./Meeple3D";
import { MeepleGroup } from "./MeepleGroup";
import { MeepleArmy } from "./MeepleArmy";

const meta = {
  title: "UI/Icons",
  component: Meeple,
  tags: ["autodocs"],
} satisfies Meta<typeof Meeple>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MeepleIcon: Story = {
  name: "Meeple",
  render: () => <Meeple size={48} />,
};

export const MeepleSizes: Story = {
  name: "Meeple – sizes",
  render: () => (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
      {[16, 24, 48, 64].map((px) => (
        <Meeple key={px} size={px} />
      ))}
    </div>
  ),
};

export const Meeple3DIcon: Story = {
  name: "Meeple3D",
  render: () => <Meeple3D size={48} />,
};

export const Meeple3DSizes: Story = {
  name: "Meeple3D – sizes",
  render: () => (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
      {[16, 24, 48, 64].map((px) => (
        <Meeple3D key={px} size={px} />
      ))}
    </div>
  ),
};

export const MeepleGroupIcon: Story = {
  name: "MeepleGroup",
  render: () => <MeepleGroup size={48} />,
};

export const MeepleGroupSizes: Story = {
  name: "MeepleGroup – sizes",
  render: () => (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
      {[16, 24, 48, 64].map((px) => (
        <MeepleGroup key={px} size={px} />
      ))}
    </div>
  ),
};

export const MeepleArmyIcon: Story = {
  name: "MeepleArmy",
  render: () => <MeepleArmy size={48} />,
};

export const MeepleArmySizes: Story = {
  name: "MeepleArmy – sizes",
  render: () => (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
      {[16, 24, 48, 64].map((px) => (
        <MeepleArmy key={px} size={px} />
      ))}
    </div>
  ),
};
