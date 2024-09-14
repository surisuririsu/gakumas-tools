import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import ButtonGroup from "@/components/ButtonGroup";

describe("ButtonGroup", () => {
  it("renders buttons with labels", () => {
    const props = {
      className: "test-class",
      selected: "opt2",
      options: [
        { value: "opt1", label: "Option 1" },
        { value: "opt2", label: "Option 2" },
        { value: "opt3", label: "Option 3" },
      ],
    };
    render(<ButtonGroup {...props} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
    expect(buttons[0]).toHaveTextContent("Option 1");
    expect(buttons[0]).not.toHaveAttribute("class", "selected");
    expect(buttons[1]).toHaveTextContent("Option 2");
    expect(buttons[1]).toHaveAttribute("class", "selected");
    expect(buttons[2]).toHaveTextContent("Option 3");
    expect(buttons[2]).not.toHaveAttribute("class", "selected");
  });

  it("handles clicks", () => {
    const props = {
      className: "test-class",
      selected: "opt2",
      options: [
        { value: "opt1", label: "Option 1" },
        { value: "opt2", label: "Option 2" },
        { value: "opt3", label: "Option 3" },
      ],
      onChange: jest.fn(),
    };
    render(<ButtonGroup {...props} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);

    fireEvent.click(buttons[2]);
    expect(props.onChange).toHaveBeenCalledWith("opt3");
  });
});
