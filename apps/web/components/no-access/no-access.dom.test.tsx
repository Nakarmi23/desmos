import { render, screen } from "@testing-library/react";

import { NoAccess } from "./no-access";

describe("NoAccess", () => {
  it("says the page isn't available to this User and links back to Overview", () => {
    render(<NoAccess />);

    expect(
      screen.getByRole("heading", { name: "You don't have access" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Go to Overview" }),
    ).toHaveAttribute("href", "/");
  });
});
