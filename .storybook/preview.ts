import type { Preview } from "@storybook/react";
import "../src/styles/tokens.css";
import "../src/styles/global.css";

const preview: Preview = {
  parameters: {
    layout: "padded",
  },
};

export default preview;
