import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useContext } from "react";
import { ModalContextProvider } from "@/contexts/ModalContext";
import Modal from "@/components/Modal";
import ModalContext from "@/contexts/ModalContext";

// Test component that can open modals programmatically
function ModalTestHarness() {
  const { setModal, closeModal } = useContext(ModalContext);

  const openFirstModal = () => {
    setModal(
      <Modal key="first">
        <button onClick={() => openSecondModal()}>Open Second Modal</button>
        <button>First Modal Button</button>
      </Modal>
    );
  };

  const openSecondModal = () => {
    setModal(
      <Modal key="second">
        <button onClick={closeModal}>Close Second Modal</button>
        <button>Second Modal Button</button>
      </Modal>
    );
  };

  return (
    <div>
      <button id="trigger" onClick={openFirstModal}>
        Open First Modal
      </button>
    </div>
  );
}

describe("Modal Stacking", () => {
  it("restores focus to first modal when second modal closes", async () => {
    render(
      <ModalContextProvider>
        <ModalTestHarness />
      </ModalContextProvider>
    );

    const triggerButton = screen.getByText("Open First Modal");
    
    // Focus should start on trigger button
    triggerButton.focus();
    expect(triggerButton).toHaveFocus();

    // Open first modal
    fireEvent.click(triggerButton);

    // First modal's close button should have focus
    await waitFor(() => {
      const closeButton = document.querySelector('button.close');
      expect(closeButton).toHaveFocus();
    });

    // Click button to open second modal
    const openSecondButton = screen.getByText("Open Second Modal");
    fireEvent.click(openSecondButton);

    // Second modal's close button should have focus
    await waitFor(() => {
      const closeButton = document.querySelector('button.close');
      expect(closeButton).toHaveFocus();
      expect(screen.getByText("Close Second Modal")).toBeInTheDocument();
    });

    // Close second modal
    const closeSecondButton = screen.getByText("Close Second Modal");
    fireEvent.click(closeSecondButton);

    // First modal should be visible again and have focus
    await waitFor(() => {
      expect(screen.queryByText("Second Modal Button")).not.toBeInTheDocument();
      expect(screen.getByText("First Modal Button")).toBeInTheDocument();
      const closeButton = document.querySelector('button.close');
      expect(closeButton).toHaveFocus();
    });
  });

  it("restores focus to original element when all modals close", async () => {
    render(
      <ModalContextProvider>
        <ModalTestHarness />
      </ModalContextProvider>
    );

    const triggerButton = screen.getByText("Open First Modal");
    
    // Focus trigger button
    triggerButton.focus();
    expect(triggerButton).toHaveFocus();

    // Open first modal
    fireEvent.click(triggerButton);

    // First modal should be open
    await waitFor(() => {
      const closeButton = document.querySelector('button.close');
      expect(closeButton).toBeInTheDocument();
    });

    // Close the modal
    const closeButton = document.querySelector('button.close');
    fireEvent.click(closeButton);

    // Focus should return to trigger button
    await waitFor(() => {
      expect(screen.queryByText("First Modal Button")).not.toBeInTheDocument();
      expect(triggerButton).toHaveFocus();
    });
  });
});
