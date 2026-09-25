import type { StorybookConfig } from "@storybook/nextjs";

const config: StorybookConfig = {
  framework: "@storybook/nextjs",
  stories: ["../stories/**/*.stories.@(ts|tsx)", "../components/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs"],
};

export default config;
