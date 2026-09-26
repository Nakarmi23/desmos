import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TopBar } from "@/components/top-bar/top-bar";

import { SidebarProvider } from "./sidebar-provider";
import { Sidebar } from "./sidebar";

// `usePathname` has no router to read from outside a Next.js app, so pin it to
// the first NAV_ITEMS href — the route the active-nav-item test asserts on.
jest.mock("next/navigation", () => ({
  usePathname: () => "/overview",
}));

// The collapse toggle lives in `TopBar`, not `Sidebar` itself, so both render
// together here — matching how the real dashboard layout composes them.
function renderSidebar({ collapsed = false } = {}) {
  return render(
    <SidebarProvider defaultCollapsed={collapsed}>
      <Sidebar />
      <TopBar />
    </SidebarProvider>,
  );
}

// Base UI's tooltip popup has no `role`, so it's found as the nav label's text
// inside a portal (the row's own label isn't portaled).
const TOOLTIP_POPUP = "[data-base-ui-portal] *";

describe("Sidebar", () => {
  it("collapses when the toggle is clicked, and expands again on a second click", async () => {
    const user = userEvent.setup();
    renderSidebar();

    const sidebar = screen.getByRole("complementary");
    expect(sidebar).toHaveAttribute("data-open");

    const collapseTrigger = screen.getByRole("button", {
      name: "Collapse sidebar",
    });
    expect(collapseTrigger).toHaveAttribute("aria-expanded", "true");

    await user.click(collapseTrigger);

    expect(sidebar).toHaveAttribute("data-closed");
    const expandTrigger = screen.getByRole("button", {
      name: "Expand sidebar",
    });
    expect(expandTrigger).toHaveAttribute("aria-expanded", "false");

    await user.click(expandTrigger);

    expect(sidebar).toHaveAttribute("data-open");
    expect(
      screen.getByRole("button", { name: "Collapse sidebar" }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("marks the nav item for the current route as active with aria-current", () => {
    renderSidebar();

    const activeLink = screen.getByRole("link", { name: "Overview" });
    expect(activeLink).toHaveAttribute("aria-current", "page");
    expect(activeLink).toHaveAttribute("data-active", "true");

    const inactiveLink = screen.getByRole("link", { name: "Settings" });
    expect(inactiveLink).not.toHaveAttribute("aria-current");
    expect(inactiveLink).not.toHaveAttribute("data-active");
  });

  it("names a nav item in a tooltip on hover only while collapsed", async () => {
    const user = userEvent.setup();
    renderSidebar({ collapsed: true });

    await user.hover(screen.getByRole("link", { name: "Settings" }));
    expect(
      await screen.findByText("Settings", { selector: TOOLTIP_POPUP }),
    ).toBeInTheDocument();
  });

  it("shows no nav tooltip while expanded", async () => {
    const user = userEvent.setup();
    renderSidebar();

    await user.hover(screen.getByRole("link", { name: "Settings" }));
    // Give a would-be tooltip the same tick to open that the collapsed case
    // gets from `findByText`.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(
      screen.queryByText("Settings", { selector: TOOLTIP_POPUP }),
    ).not.toBeInTheDocument();
  });
});
