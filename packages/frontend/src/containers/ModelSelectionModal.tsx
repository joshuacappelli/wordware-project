import React, { useState } from "react";
import { Modal, Button, Dropdown, DropdownButton } from "react-bootstrap";
import LoaderButton from "../components/LoaderButton";


interface ModelSelectionModalProps {
  show: boolean;
  handleClose: () => void;
  handleRun: (model: string) => void;
}

function ModelSelectionModal({ show, handleClose, handleRun }: ModelSelectionModalProps) {
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const models = [
    "gpt2",
    "microsoft/DialoGPT-medium",
    "facebook/bart-large",
    "openai-gpt",
    "EleutherAI/gpt-neo-2.7B",
  ];

  const handleModelSelect = (eventKey: string | null) => {
    if (eventKey) {
      setSelectedModel(eventKey);
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
          onClick={() => handleRun(selectedModel)}
          disabled={!selectedModel}
        >
          Run
        </LoaderButton>
      </Modal.Footer>
    </Modal>
  );
}

export default ModelSelectionModal;
