import type { Meta, StoryObj } from "@storybook/nextjs";

import { PasswordField } from "./password-field";

const meta = {
  title: "PasswordField",
  component: PasswordField,
  args: { label: "Password", defaultValue: "correct horse battery staple" },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PasswordField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = { args: { defaultValue: "" } };

export const Invalid: Story = {
  args: { defaultValue: "", error: "Enter your password" },
};

export const Disabled: Story = { args: { disabled: true } };
