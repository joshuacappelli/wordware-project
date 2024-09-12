import React, { useState } from "react";
import { Modal, Button, Dropdown, DropdownButton } from "react-bootstrap";
import LoaderButton from "../components/LoaderButton";

interface ModelSelectionModalProps {
  show: boolean;
  handleClose: () => void;
  handleRun: (model: string) => Promise<void>; // Change the return type to Promise<void>
}

function ModelSelectionModal({ show, handleClose, handleRun }: ModelSelectionModalProps) {
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const models = [
    "gpt2",
    "01-ai/Yi-Coder-1.5B-Chat",
    "microsoft/Phi-3-mini-4k-instruct",
    "openai-gpt",
    "openai/whisper-large-v3",
  ];

  const handleModelSelect = (eventKey: string | null) => {
    if (eventKey) {
      setSelectedModel(eventKey);
    }
  };

  const handleRunClick = async () => {
    if (selectedModel) {
      setIsLoading(true); // Start the loading animation
      try {
        await handleRun(selectedModel); // Wait for the handleRun function to complete
      } finally {
        setIsLoading(false); // Stop the loading animation
      }
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Select a Model</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <DropdownButton title={selectedModel || "Choose Model"} onSelect={handleModelSelect}>
          {models.map((model) => (
            <Dropdown.Item key={model} eventKey={model}>
              {model}
            </Dropdown.Item>
          ))}
        </DropdownButton>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <LoaderButton
          variant="primary"
          onClick={handleRunClick}
          disabled={!selectedModel}
          isLoading={isLoading} // Pass isLoading state to LoaderButton
        >
          Continue
        </LoaderButton>
      </Modal.Footer>
    </Modal>
  );
}

export default ModelSelectionModal;
