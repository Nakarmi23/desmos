import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SessionProvider } from "@/components/session/session-provider";
import { TopBar } from "@/components/top-bar/top-bar";

import { SidebarProvider } from "./sidebar-provider";
import { UserMenu } from "./user-menu";

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

const ADA = { id: "ada-id", name: "Ada Lovelace", username: "alovelace" };

function renderWithSession(ui: React.ReactNode, signOut = jest.fn()) {
  render(
    <SessionProvider user={ADA} signOut={signOut}>
      <SidebarProvider defaultCollapsed={false}>{ui}</SidebarProvider>
    </SessionProvider>,
  );
  return { signOut };
}

describe("UserMenu", () => {
  it("shows the signed-in User's name and Username", () => {
    renderWithSession(<UserMenu />);

    const trigger = screen.getByRole("button", { name: /Ada Lovelace/ });
    expect(trigger).toHaveTextContent("alovelace");
  });

  it("signs out from the menu", async () => {
    const user = userEvent.setup();
    const { signOut } = renderWithSession(<UserMenu />);

    await user.click(screen.getByRole("button", { name: /Ada Lovelace/ }));
    await user.click(await screen.findByRole("menuitem", { name: "Sign out" }));

    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("keeps Profile and Settings in the menu", async () => {
    const user = userEvent.setup();
    renderWithSession(<UserMenu />);

    await user.click(screen.getByRole("button", { name: /Ada Lovelace/ }));

    expect(
      await screen.findByRole("menuitem", { name: "Profile" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Settings" }),
    ).toBeInTheDocument();
  });
});

describe("TopBar account menu (small screens)", () => {
  it("opens the same menu from an avatar button, signing out from it", async () => {
    const user = userEvent.setup();
    const { signOut } = renderWithSession(<TopBar />);

    const trigger = screen.getByRole("button", {
      name: "Account: Ada Lovelace",
    });
    // Only below `lg`; the sidebar has the menu on wider screens.
    expect(trigger).toHaveClass("lg:hidden");

    await user.click(trigger);
    await user.click(await screen.findByRole("menuitem", { name: "Sign out" }));

    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
