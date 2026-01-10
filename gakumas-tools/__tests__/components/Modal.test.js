import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { ModalContextProvider } from "@/contexts/ModalContext";
import Modal from "@/components/Modal";

describe("Modal", () => {
  it("focuses first focusable element when opened", async () => {
    render(
      <ModalContextProvider>
        <Modal>
          <button>First Button</button>
          <button>Second Button</button>
        </Modal>
      </ModalContextProvider>
    );

    // The close button (X) is rendered first, so it should get focus
    const closeButton = document.querySelector('button.close');
    await waitFor(() => {
      expect(closeButton).toHaveFocus();
    });
  });

  it("has modal element with tabindex for focus", () => {
    render(
      <ModalContextProvider>
        <Modal>
          <button>First Button</button>
          <button>Second Button</button>
        </Modal>
      </ModalContextProvider>
    );

    const modal = document.querySelector('[tabindex="-1"]');
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveClass('modal');
  });

  it("focuses modal element when no focusable children", async () => {
    render(
      <ModalContextProvider>
        <Modal dismissable={false}>
          <p>Just some text</p>
        </Modal>
      </ModalContextProvider>
    );

    // Modal itself should be focused
    const modal = document.querySelector('[tabindex="-1"]');
    await waitFor(() => {
      expect(modal).toHaveFocus();
    });
  });

  it("renders overlay and modal container", () => {
    render(
      <ModalContextProvider>
        <Modal>
          <p>Test content</p>
        </Modal>
      </ModalContextProvider>
    );

    const overlay = document.querySelector('.overlay');
    const modal = document.querySelector('.modal');
    
    expect(overlay).toBeInTheDocument();
    expect(modal).toBeInTheDocument();
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });
});
