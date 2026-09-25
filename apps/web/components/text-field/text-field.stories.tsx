import type { Meta, StoryObj } from "@storybook/nextjs";
import { AtSignIcon, CheckIcon, MailIcon, SearchIcon } from "lucide-react";
import { useState, type ComponentProps } from "react";

import { TextField } from "./text-field";

const meta = {
  title: "TextField",
  component: TextField,
  args: { label: "Name", placeholder: "Ada Lovelace" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    type: {
      control: "select",
      options: ["text", "email", "password", "search", "url", "tel"],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithDescription: Story = {
  args: { description: "As shown on your profile." },
};

export const Required: Story = { args: { required: true } };

export const Invalid: Story = {
  args: { defaultValue: "ada@", type: "email", error: "Enter a valid email." },
};

export const InvalidWithoutMessage: Story = { args: { invalid: true } };

export const Disabled: Story = {
  args: { defaultValue: "Ada Lovelace", disabled: true },
};

export const ReadOnly: Story = {
  args: { defaultValue: "Ada Lovelace", readOnly: true },
};

export const Loading: Story = {
  args: { label: "Username", defaultValue: "ada", loading: true },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <TextField {...args} size="sm" label="Small" />
      <TextField {...args} size="md" label="Medium" />
      <TextField {...args} size="lg" label="Large" />
    </div>
  ),
};

export const Prefix: Story = {
  args: { label: "Search", placeholder: "Find a user", prefix: <SearchIcon /> },
};

export const Suffix: Story = {
  args: { label: "Weight", placeholder: "0", suffix: "kg", type: "number" },
};

export const PrefixAndSuffix: Story = {
  args: {
    label: "Price",
    placeholder: "0.00",
    prefix: "$",
    suffix: "USD",
    inputMode: "decimal",
  },
};

export const IconAdornments: Story = {
  args: {
    label: "Email",
    type: "email",
    placeholder: "you@example.com",
    prefix: <MailIcon />,
    suffix: <CheckIcon className="text-text-selected" />,
  },
};

export const Clearable: Story = {
  args: {
    label: "Handle",
    defaultValue: "ada",
    clearable: true,
    prefix: <AtSignIcon />,
  },
};

export const WithCounter: Story = {
  args: {
    label: "Bio",
    maxLength: 40,
    showCount: true,
    defaultValue: "Mathematician",
    description: "A short line about you.",
  },
};

function ControlledExample(args: ComponentProps<typeof TextField>) {
  const [value, setValue] = useState("");
  const tooShort = value.length > 0 && value.length < 3;
  return (
    <TextField
      {...args}
      label="Username"
      placeholder="At least 3 characters"
      value={value}
      onValueChange={setValue}
      clearable
      error={tooShort ? "Too short." : undefined}
      description={`${value.length} characters`}
    />
  );
}

export const Controlled: Story = {
  render: (args) => <ControlledExample {...args} />,
};
