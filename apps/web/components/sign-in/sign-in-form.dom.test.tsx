import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SignInForm, type SignInState } from "./sign-in-form";

type Action = (state: SignInState, formData: FormData) => Promise<SignInState>;

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText(/Username/), "admin");
  await userEvent.type(screen.getByLabelText(/Password/), "secret");
  await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("SignInForm", () => {
  it("submits the Username, password and where to return to", async () => {
    const action = jest.fn<ReturnType<Action>, Parameters<Action>>(
      async () => undefined,
    );
    render(<SignInForm action={action} returnTo="/users?page=2" />);

    await fillAndSubmit();

    expect(action).toHaveBeenCalledTimes(1);
    const formData = action.mock.calls[0][1];
    expect(Object.fromEntries(formData)).toEqual({
      username: "admin",
      password: "secret",
      returnTo: "/users?page=2",
    });
  });

  it("masks the password", () => {
    render(<SignInForm action={async () => undefined} />);
    expect(screen.getByLabelText(/Password/)).toHaveAttribute(
      "type",
      "password",
    );
  });

  it("shows the submit button as busy while signing in", async () => {
    let finish!: () => void;
    const action: Action = () =>
      new Promise((resolve) => {
        finish = () => resolve(undefined);
      });
    render(<SignInForm action={action} />);

    await fillAndSubmit();

    const button = screen.getByRole("button", { name: "Sign in" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
    finish();
    await waitFor(() => expect(button).not.toHaveAttribute("aria-busy"));
  });

  it("shows the error the action reports, keeping the Username but not the password", async () => {
    render(
      <SignInForm
        action={async (_, formData) => ({
          error: "Username or password is incorrect",
          username: String(formData.get("username")),
        })}
      />,
    );

    await fillAndSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Username or password is incorrect",
    );
    expect(screen.getByLabelText(/Username/)).toHaveValue("admin");
    expect(screen.getByLabelText(/Password/)).toHaveValue("");

    // And again on a second refusal for the same Username.
    await userEvent.type(screen.getByLabelText(/Password/), "retry");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() =>
      expect(screen.getByLabelText(/Password/)).toHaveValue(""),
    );
    expect(screen.getByLabelText(/Username/)).toHaveValue("admin");
  });

  describe("validation", () => {
    const signInButton = () => screen.getByRole("button", { name: "Sign in" });

    it("flags an empty Username and password on the fields, without submitting", async () => {
      const action = jest.fn<ReturnType<Action>, Parameters<Action>>();
      render(<SignInForm action={action} />);

      await userEvent.click(signInButton());

      const username = screen.getByLabelText(/Username/);
      const password = screen.getByLabelText(/Password/);
      expect(username).toBeInvalid();
      expect(username).toHaveAccessibleDescription("Enter your Username");
      expect(password).toBeInvalid();
      expect(password).toHaveAccessibleDescription("Enter your password");
      expect(action).not.toHaveBeenCalled();
    });

    it("treats a blank Username as empty", async () => {
      render(<SignInForm action={jest.fn()} />);

      await userEvent.type(screen.getByLabelText(/Username/), "   ");
      await userEvent.type(screen.getByLabelText(/Password/), "secret");
      await userEvent.click(signInButton());

      expect(screen.getByLabelText(/Username/)).toHaveAccessibleDescription(
        "Enter your Username",
      );
      expect(screen.getByLabelText(/Password/)).not.toBeInvalid();
    });

    it("keeps what was typed and submits once the fields are filled in", async () => {
      const action = jest.fn<ReturnType<Action>, Parameters<Action>>(
        async () => undefined,
      );
      render(<SignInForm action={action} />);

      await userEvent.type(screen.getByLabelText(/Password/), "secret");
      await userEvent.click(signInButton());
      expect(screen.getByLabelText(/Password/)).toHaveValue("secret");
      expect(action).not.toHaveBeenCalled();

      await userEvent.type(screen.getByLabelText(/Username/), "admin");
      await userEvent.click(signInButton());

      await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
      expect(screen.getByLabelText(/Username/)).not.toBeInvalid();
    });

    it("shows field errors the action reports", async () => {
      render(
        <SignInForm
          action={async () => ({
            fieldErrors: { password: "Enter your password" },
            username: "admin",
          })}
        />,
      );

      await fillAndSubmit();

      expect(
        await screen.findByLabelText(/Password/),
      ).toHaveAccessibleDescription("Enter your password");
    });
  });
});
