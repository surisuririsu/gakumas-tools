import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import Button from "@/components/Button";

describe("Button", () => {
  it("renders a button when no href prop is provided", () => {
    const props = {
      children: "Click me!",
      onClick: jest.fn(),
      style: "secondary",
    };
    render(<Button {...props} />);

    const link = screen.queryByRole("link");
    expect(link).toBeNull();

    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("Click me!");
    expect(button).toHaveAttribute("class", "button secondary");

    fireEvent.click(button);
    expect(props.onClick).toHaveBeenCalled();
  });

  it("renders a link when href prop is provided", () => {
    const props = {
      children: "Click me!",
      onClick: jest.fn(),
      href: "https://www.example.org",
      target: "_blank",
      style: "secondary",
    };
    render(
      <NextIntlClientProvider locale="en">
        <Button {...props} />
      </NextIntlClientProvider>
    );

    const button = screen.queryByRole("button");
    expect(button).toBeNull();

    const link = screen.getByRole("link");
    expect(link).toHaveTextContent("Click me!");
    expect(link).toHaveAttribute("class", "button secondary");
    expect(link).toHaveAttribute("href", "https://www.example.org");
    expect(link).toHaveAttribute("target", "_blank");

    fireEvent.click(link);
    expect(props.onClick).toHaveBeenCalled();
  });

  it("overrides style when disabled", () => {
    const props = {
      disabled: true,
      style: "secondary",
    };
    render(<Button {...props} />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("class", "button disabled");
  });

  it("uses fill style when fill prop is true", () => {
    const props = {
      fill: true,
      style: "secondary",
    };
    render(<Button {...props} />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("class", "button secondary fill");
  });
});
