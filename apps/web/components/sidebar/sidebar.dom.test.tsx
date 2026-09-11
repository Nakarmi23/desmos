import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SidebarProvider } from "./sidebar-provider";
import { Sidebar } from "./sidebar";

// `usePathname` has no router to read from outside a Next.js app, so pin it to
// the first NAV_ITEMS href — the route the active-nav-item test asserts on.
jest.mock("next/navigation", () => ({
  usePathname: () => "/overview",
}));

/** Renders an expanded sidebar; tests collapse it by clicking the trigger. */
function renderSidebar() {
  return render(
    <SidebarProvider defaultCollapsed={false}>
      <Sidebar />
    </SidebarProvider>,
  );
}

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
});
