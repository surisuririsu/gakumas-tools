import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { ModalContextProvider } from "@/contexts/ModalContext";
import ConfirmModal from "@/components/ConfirmModal";

jest.mock("next-intl", () => ({
  useTranslations: () => (s) => s,
}));

describe("ConfirmModal", () => {
  it("renders modal with message and buttons", () => {
    const props = {
      message: "Are you sure?",
    };
    render(
      <ModalContextProvider>
        <ConfirmModal {...props} />
      </ModalContextProvider>
    );

    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ok" })).toBeInTheDocument();
  });

  it("handles cancel click", () => {
    const props = {
      message: "Are you sure?",
      onConfirm: jest.fn(),
      onCancel: jest.fn(),
    };
    render(
      <ModalContextProvider>
        <ConfirmModal {...props} />
      </ModalContextProvider>
    );

    const cancelButton = screen.getByRole("button", { name: "cancel" });

    fireEvent.click(cancelButton);
    expect(props.onCancel).toHaveBeenCalled();
    expect(props.onConfirm).not.toHaveBeenCalled();
  });

  it("handles confirm click", () => {
    const props = {
      message: "Are you sure?",
      onConfirm: jest.fn(),
      onCancel: jest.fn(),
    };
    render(
      <ModalContextProvider>
        <ConfirmModal {...props} />
      </ModalContextProvider>
    );

    const cancelButton = screen.getByRole("button", { name: "ok" });

    fireEvent.click(cancelButton);
    expect(props.onConfirm).toHaveBeenCalled();
    expect(props.onCancel).not.toHaveBeenCalled();
  });
});
