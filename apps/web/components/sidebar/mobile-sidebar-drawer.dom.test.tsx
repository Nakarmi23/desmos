import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TopBar } from "@/components/top-bar/top-bar";

import { SidebarProvider } from "./sidebar-provider";
import { MobileSidebarDrawer } from "./mobile-sidebar-drawer";

jest.mock("next/navigation", () => ({
  usePathname: () => "/overview",
}));

// `TopBar` (which owns the hamburger trigger) and `MobileSidebarDrawer` are
// siblings sharing `SidebarProvider` state, matching the real dashboard
// layout's composition.
function renderDrawer() {
  return render(
    <SidebarProvider defaultCollapsed={false}>
      <TopBar />
      <MobileSidebarDrawer />
    </SidebarProvider>,
  );
}

describe("MobileSidebarDrawer", () => {
  it("is closed by default", () => {
    renderDrawer();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens via the top bar's hamburger trigger", async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.click(screen.getByRole("button", { name: "Open navigation" }));

    expect(screen.getByRole("dialog", { name: "Navigation" })).toBeVisible();
  });

  it("closes via its own close action", async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    expect(screen.getByRole("dialog", { name: "Navigation" })).toBeVisible();

    await user.click(
      screen.getByRole("button", { name: "Close navigation" }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("marks the nav item for the current route as active", async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.click(screen.getByRole("button", { name: "Open navigation" }));

    const activeLink = screen.getByRole("link", { name: "Overview" });
    expect(activeLink).toHaveAttribute("aria-current", "page");
    expect(activeLink).toHaveAttribute("data-active", "true");

    const inactiveLink = screen.getByRole("link", { name: "Settings" });
    expect(inactiveLink).not.toHaveAttribute("aria-current");
    expect(inactiveLink).not.toHaveAttribute("data-active");
  });
});
