import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PasswordField } from "./password-field";

const input = () => screen.getByLabelText("Password");

describe("PasswordField", () => {
  it("masks the password until asked to show it", async () => {
    render(<PasswordField label="Password" />);
    await userEvent.type(input(), "secret");

    expect(input()).toHaveAttribute("type", "password");
    const show = screen.getByRole("button", { name: "Show password" });
    expect(show).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(show);

    expect(input()).toHaveAttribute("type", "text");
    expect(input()).toHaveValue("secret");
    expect(
      screen.getByRole("button", { name: "Hide password" }),
    ).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(
      screen.getByRole("button", { name: "Hide password" }),
    );

    expect(input()).toHaveAttribute("type", "password");
  });

  it("toggles without submitting the form it's in", async () => {
    const onSubmit = jest.fn((event) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <PasswordField label="Password" />
      </form>,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Show password" }),
    );

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("can't be toggled while disabled", () => {
    render(<PasswordField label="Password" disabled />);
    expect(
      screen.getByRole("button", { name: "Show password" }),
    ).toBeDisabled();
  });

  it("passes field props through", () => {
    render(
      <PasswordField
        label="Password"
        name="password"
        error="Enter your password"
      />,
    );
    expect(input()).toHaveAttribute("name", "password");
    expect(input()).toHaveAccessibleDescription("Enter your password");
  });
});
