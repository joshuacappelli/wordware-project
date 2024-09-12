import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap"; // Added Form import
import LoaderButton from "../components/LoaderButton";

interface VariableInputModalProps {
  show: boolean;
  handleClose: () => void;
  handleSave: () => Promise<void>; // Ensure handleSave returns a Promise
  variables: string[]; // List of variable names
  variableValues: { [key: string]: string }; // Current values for each variable
  setVariableValues: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>; // State setter for variables
}

function VariableInputModal({
  show,
  handleClose,
  handleSave,
  variables,
  variableValues,
  setVariableValues,
}: VariableInputModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVariableValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveClick = async () => {
    setIsLoading(true); // Start loading
    try {
      await handleSave(); // Wait for save operation to complete
    } catch (e) {
      console.error("Error saving variables:", e); // Handle error (optional)
    } finally {
      setIsLoading(false); // Stop loading
      handleClose(); // Close modal
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Provide Values for Variables</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {variables.map((variable) => (
            <Form.Group controlId={variable} key={variable}>
              <Form.Label>{variable}</Form.Label>
              <Form.Control
                type="text"
                name={variable}
                value={variableValues[variable] || ""}
                onChange={handleChange}
                placeholder={`Enter value for ${variable}`}
              />
            </Form.Group>
          ))}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        {/* Use LoaderButton for showing loading state */}
        <LoaderButton
          variant="primary"
          onClick={handleSaveClick}
          isLoading={isLoading} // Loader button uses this state to show spinner
          disabled={isLoading}
        >
          Run
        </LoaderButton>
      </Modal.Footer>
    </Modal>
  );
}

export default VariableInputModal;
