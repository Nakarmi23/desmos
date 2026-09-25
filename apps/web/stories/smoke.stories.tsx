import type { Meta, StoryObj } from "@storybook/nextjs";

/**
 * Proves the Storybook pipeline end-to-end: the Next.js framework preset
 * renders this story, and the `bg-surface`/`text-text`/`border-border`
 * classes below are only styled correctly if the app's Tailwind CSS
 * (`app/globals.css`) is loading in the Storybook preview.
 */
function StorybookSmokeTest() {
  return (
    <div className="rounded-md border border-border bg-surface p-4 text-text">
      Storybook is wired up to apps/web.
    </div>
  );
}

const meta = {
  title: "Storybook Smoke Test",
  component: StorybookSmokeTest,
} satisfies Meta<typeof StorybookSmokeTest>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
