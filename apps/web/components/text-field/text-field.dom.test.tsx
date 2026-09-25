import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import { TextField } from "./text-field";

describe("TextField", () => {
  it("labels the input and marks required", () => {
    render(<TextField label="Name" required />);
    const input = screen.getByLabelText(/Name/);
    expect(input).toBeRequired();
  });

  it("describes the input with helper text", () => {
    render(<TextField label="Name" description="Shown publicly" />);
    expect(screen.getByLabelText("Name")).toHaveAccessibleDescription(
      "Shown publicly",
    );
  });

  it("shows error instead of description and flags invalid", () => {
    render(
      <TextField label="Name" description="Shown publicly" error="Required" />,
    );
    const input = screen.getByLabelText("Name");
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription("Required");
    expect(screen.queryByText("Shown publicly")).not.toBeInTheDocument();
  });

  it("works uncontrolled and reports value changes", async () => {
    const onValueChange = jest.fn();
    render(<TextField label="Name" onValueChange={onValueChange} />);
    await userEvent.type(screen.getByLabelText("Name"), "ab");
    expect(screen.getByLabelText("Name")).toHaveValue("ab");
    expect(onValueChange).toHaveBeenLastCalledWith("ab");
  });

  it("works controlled", async () => {
    function Harness() {
      const [v, setV] = useState("x");
      return <TextField label="Name" value={v} onValueChange={setV} />;
    }
    render(<Harness />);
    await userEvent.type(screen.getByLabelText("Name"), "y");
    expect(screen.getByLabelText("Name")).toHaveValue("xy");
  });

  it("clears and refocuses", async () => {
    const onClear = jest.fn();
    render(
      <TextField label="Name" defaultValue="Ada" clearable onClear={onClear} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(screen.getByLabelText("Name")).toHaveFocus();
    expect(onClear).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Clear" })).toBeNull();
  });

  it("hides clear when disabled or read-only", () => {
    const { rerender } = render(
      <TextField label="Name" defaultValue="Ada" clearable disabled />,
    );
    expect(screen.queryByRole("button", { name: "Clear" })).toBeNull();
    rerender(<TextField label="Name" defaultValue="Ada" clearable readOnly />);
    expect(screen.queryByRole("button", { name: "Clear" })).toBeNull();
  });

  it("renders prefix and suffix", () => {
    render(<TextField label="Price" prefix="$" suffix="USD" />);
    expect(screen.getByText("$")).toBeInTheDocument();
    expect(screen.getByText("USD")).toBeInTheDocument();
  });

  it("replaces suffix with a busy state while loading", () => {
    render(<TextField label="Name" suffix="USD" loading />);
    expect(screen.getByLabelText("Name")).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText("USD")).toBeNull();
  });

  it("shows a character counter", async () => {
    render(<TextField label="Bio" maxLength={10} showCount />);
    expect(screen.getByText("0/10")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Bio"), "abc");
    expect(screen.getByText("3/10")).toBeInTheDocument();
  });

  it("forwards ref to the input", () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<TextField label="Name" ref={ref} />);
    expect(ref.current).toBe(screen.getByLabelText("Name"));
  });
});
