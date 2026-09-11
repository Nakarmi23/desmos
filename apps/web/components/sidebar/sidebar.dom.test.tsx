import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SidebarProvider } from "./sidebar-provider";
import { Sidebar } from "./sidebar";

jest.mock("next/navigation", () => ({
  usePathname: () => "/overview",
}));

function renderSidebar(defaultCollapsed: boolean) {
  return render(
    <SidebarProvider defaultCollapsed={defaultCollapsed}>
      <Sidebar />
    </SidebarProvider>,
  );
}

describe("Sidebar", () => {
  it("collapses when the toggle is clicked, and expands again on a second click", async () => {
    const user = userEvent.setup();
    renderSidebar(false);

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
    renderSidebar(false);

    const activeLink = screen.getByRole("link", { name: "Overview" });
    expect(activeLink).toHaveAttribute("aria-current", "page");
    expect(activeLink).toHaveAttribute("data-active", "true");

    const inactiveLink = screen.getByRole("link", { name: "Settings" });
    expect(inactiveLink).not.toHaveAttribute("aria-current");
    expect(inactiveLink).not.toHaveAttribute("data-active");
  });
});
