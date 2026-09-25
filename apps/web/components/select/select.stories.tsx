import type { Meta, StoryObj } from "@storybook/nextjs";
import { GlobeIcon } from "lucide-react";
import { useState, type ComponentProps } from "react";

import { Select } from "./select";

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
];

const meta = {
  title: "Select",
  component: Select,
  args: { label: "Role", options: ROLES },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithPlaceholder: Story = {
  args: { placeholder: "Choose a role" },
};

export const WithDescription: Story = {
  args: { description: "Controls what this user can do." },
};

export const Required: Story = {
  args: { required: true, placeholder: "Choose a role" },
};

export const Invalid: Story = {
  args: { placeholder: "Choose a role", error: "Pick a role to continue." },
};

export const Disabled: Story = {
  args: { defaultValue: "member", disabled: true },
};

export const DisabledOption: Story = {
  args: {
    options: [...ROLES, { value: "owner", label: "Owner", disabled: true }],
  },
};

export const WithPrefix: Story = {
  args: {
    label: "Region",
    prefix: <GlobeIcon />,
    options: [
      { value: "eu", label: "Europe" },
      { value: "us", label: "United States" },
      { value: "ap", label: "Asia Pacific" },
    ],
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Select {...args} size="sm" label="Small" />
      <Select {...args} size="md" label="Medium" />
      <Select {...args} size="lg" label="Large" />
    </div>
  ),
};

function ControlledExample(args: ComponentProps<typeof Select>) {
  const [value, setValue] = useState("");
  return (
    <Select
      {...args}
      placeholder="Choose a role"
      value={value}
      onValueChange={setValue}
      description={value ? `Selected: ${value}` : "Nothing selected"}
    />
  );
}

export const Controlled: Story = {
  render: (args) => <ControlledExample {...args} />,
};
