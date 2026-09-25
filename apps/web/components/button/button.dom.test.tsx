import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Button, IconButton } from "./button";

describe("Button", () => {
  it("defaults to type=button", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute(
      "type",
      "button",
    );
  });

  it("fires onClick", async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Save</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire when disabled", async () => {
    const onClick = jest.fn();
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("is busy and inert while loading", async () => {
    const onClick = jest.fn();
    render(
      <Button loading startIcon={<span>icon</span>} onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText("icon")).toBeNull();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders start and end icons", () => {
    render(
      <Button startIcon={<span>a</span>} endIcon={<span>b</span>}>
        Go
      </Button>,
    );
    expect(screen.getByRole("button")).toHaveTextContent("aGob");
  });

  it("marks selected", () => {
    render(<Button selected>1</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("data-selected");
  });

  it("forwards ref and native props", () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(
      <Button ref={ref} type="submit" aria-current="page">
        Go
      </Button>,
    );
    expect(ref.current).toBe(screen.getByRole("button"));
    expect(ref.current).toHaveAttribute("type", "submit");
    expect(ref.current).toHaveAttribute("aria-current", "page");
  });
});

describe("IconButton", () => {
  it("is named by its label", () => {
    render(
      <IconButton label="Close">
        <span aria-hidden>x</span>
      </IconButton>,
    );
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("is busy and inert while loading", () => {
    render(
      <IconButton label="Close" loading>
        <span>x</span>
      </IconButton>,
    );
    const button = screen.getByRole("button", { name: "Close" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText("x")).toBeNull();
  });
});
