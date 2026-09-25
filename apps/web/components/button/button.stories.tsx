import type { Meta, StoryObj } from "@storybook/nextjs";
import {
  ArrowRightIcon,
  PlusIcon,
  SettingsIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";

import { Button, IconButton } from "./button";

const VARIANTS = ["primary", "secondary", "subtle", "danger", "link"] as const;
const SIZES = ["xs", "sm", "md", "lg"] as const;

const meta = {
  title: "Button",
  component: Button,
  args: { children: "Save changes" },
  argTypes: {
    variant: { control: "select", options: VARIANTS },
    size: { control: "inline-radio", options: SIZES },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Primary: Story = { args: { variant: "primary" } };
export const Secondary: Story = { args: { variant: "secondary" } };
export const Subtle: Story = { args: { variant: "subtle" } };
export const Danger: Story = {
  args: { variant: "danger", children: "Delete" },
};
export const Link: Story = {
  args: { variant: "link", children: "Learn more" },
};

export const Disabled: Story = { args: { variant: "primary", disabled: true } };
export const Loading: Story = { args: { variant: "primary", loading: true } };
export const Selected: Story = { args: { selected: true, children: "3" } };

export const WithStartIcon: Story = {
  args: { variant: "primary", startIcon: <PlusIcon />, children: "New user" },
};
export const WithEndIcon: Story = {
  args: { endIcon: <ArrowRightIcon />, children: "Continue" },
};

export const AllVariants: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      {[false, true].map((disabled) => (
        <div
          key={String(disabled)}
          className="flex flex-wrap items-center gap-3"
        >
          {VARIANTS.map((variant) => (
            <Button
              key={variant}
              {...args}
              variant={variant}
              disabled={disabled}
            >
              {variant}
            </Button>
          ))}
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      {SIZES.map((size) => (
        <Button key={size} {...args} variant="primary" size={size}>
          {size}
        </Button>
      ))}
    </div>
  ),
};

export const IconButtons: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {VARIANTS.filter((v) => v !== "link").map((variant) => (
        <div key={variant} className="flex items-center gap-3">
          {SIZES.map((size) => (
            <IconButton
              key={size}
              label={`Settings (${variant} ${size})`}
              variant={variant}
              size={size}
            >
              <SettingsIcon />
            </IconButton>
          ))}
          <IconButton label="Close" variant={variant} loading>
            <XIcon />
          </IconButton>
          <IconButton label="Delete" variant={variant} disabled>
            <Trash2Icon />
          </IconButton>
        </div>
      ))}
    </div>
  ),
};
