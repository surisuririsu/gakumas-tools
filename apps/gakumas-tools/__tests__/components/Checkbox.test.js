import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import Checkbox from "@/components/Checkbox";

describe("Checkbox", () => {
  it("renders checkbox with label", () => {
    const props = {
      checked: true,
      label: "Test label",
    };
    render(<Checkbox {...props} />);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAttribute("checked");
    expect(screen.getByText("Test label")).toBeInTheDocument();
  });

  it("handles clicks", () => {
    const props = {
      checked: true,
      label: "Test label",
      onChange: jest.fn(),
    };
    render(<Checkbox {...props} />);

    const checkbox = screen.getByRole("checkbox");

    fireEvent.click(checkbox);
    expect(props.onChange).toHaveBeenCalledWith(false);
  });
});
