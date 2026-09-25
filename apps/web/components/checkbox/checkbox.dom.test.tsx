import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Checkbox } from "./checkbox";

describe("Checkbox", () => {
  it("reflects `checked` and reports changes", async () => {
    const onChange = jest.fn();
    render(<Checkbox aria-label="Pick" checked={false} onChange={onChange} />);

    const box = screen.getByRole("checkbox", { name: "Pick" });
    expect(box).not.toBeChecked();
    await userEvent.click(box);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("is named by its label, and clicking the label toggles it", async () => {
    const onChange = jest.fn();
    render(<Checkbox label="Admin" checked onChange={onChange} />);

    expect(screen.getByRole("checkbox", { name: "Admin" })).toBeChecked();
    await userEvent.click(screen.getByText("Admin"));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("shows the mixed state through both the DOM and ARIA", () => {
    render(
      <Checkbox aria-label="Some" checked={false} mixed onChange={() => {}} />,
    );

    const box = screen.getByRole("checkbox", { name: "Some" });
    expect((box as HTMLInputElement).indeterminate).toBe(true);
    expect(box).toHaveAttribute("aria-checked", "mixed");
  });

  it("does not fire when disabled", async () => {
    const onChange = jest.fn();
    render(
      <Checkbox
        aria-label="Pick"
        checked={false}
        disabled
        onChange={onChange}
      />,
    );

    await userEvent.click(screen.getByRole("checkbox", { name: "Pick" }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
