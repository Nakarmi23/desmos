import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import { Select } from "./select";

const options = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
  { value: "c" },
];

describe("Select", () => {
  it("is labelled and lists options, defaulting to the first", () => {
    render(<Select label="Letter" options={options} />);
    const select = screen.getByLabelText("Letter");
    expect(select).toHaveValue("a");
    expect(
      within(select)
        .getAllByRole("option")
        .map((o) => o.textContent),
    ).toEqual(["Alpha", "Beta", "c"]);
  });

  it("starts empty with a placeholder", () => {
    render(<Select label="Letter" options={options} placeholder="Pick one" />);
    expect(screen.getByLabelText("Letter")).toHaveValue("");
    expect(
      screen.getByRole("option", { name: "Pick one" }),
    ).toBeInTheDocument();
  });

  it("uncontrolled: reports and holds the chosen value", async () => {
    const onValueChange = jest.fn();
    render(
      <Select label="Letter" options={options} onValueChange={onValueChange} />,
    );
    await userEvent.selectOptions(screen.getByLabelText("Letter"), "b");
    expect(screen.getByLabelText("Letter")).toHaveValue("b");
    expect(onValueChange).toHaveBeenCalledWith("b");
  });

  it("controlled: follows `value`", async () => {
    function Harness() {
      const [v, setV] = useState("a");
      return (
        <Select
          label="Letter"
          options={options}
          value={v}
          onValueChange={setV}
        />
      );
    }
    render(<Harness />);
    await userEvent.selectOptions(screen.getByLabelText("Letter"), "c");
    expect(screen.getByLabelText("Letter")).toHaveValue("c");
  });

  it("shows error instead of description and flags invalid", () => {
    render(
      <Select
        label="Letter"
        options={options}
        description="Help"
        error="Required"
      />,
    );
    const select = screen.getByLabelText("Letter");
    expect(select).toBeInvalid();
    expect(select).toHaveAccessibleDescription("Required");
  });

  it("can be disabled", () => {
    render(<Select label="Letter" options={options} disabled />);
    expect(screen.getByLabelText("Letter")).toBeDisabled();
  });

  it("renders a prefix and forwards ref", () => {
    const ref = { current: null as HTMLSelectElement | null };
    render(<Select label="Letter" options={options} prefix="#" ref={ref} />);
    expect(screen.getByText("#")).toBeInTheDocument();
    expect(ref.current).toBe(screen.getByLabelText("Letter"));
  });
});
