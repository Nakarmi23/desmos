import type { Meta, StoryObj } from "@storybook/nextjs";

import { Checkbox } from "./checkbox";

const meta = {
  title: "Checkbox",
  component: Checkbox,
  args: { checked: false, label: "Accept terms", onChange: () => {} },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};
export const Checked: Story = { args: { checked: true } };
export const Mixed: Story = { args: { mixed: true } };
export const Disabled: Story = { args: { disabled: true } };
export const WithoutLabel: Story = {
  args: { label: undefined, "aria-label": "Select row" },
};
