import { useState, useEffect } from "react";
import ListGroup from "react-bootstrap/ListGroup";
import { useAppContext } from "../lib/contextLib";
import "./Home.css";
import { API } from "aws-amplify";
import { PromptType } from "../types/prompt";
import { onError } from "../lib/errorLib";
import { BsPencilSquare, BsThreeDotsVertical } from "react-icons/bs";
import { LinkContainer } from "react-router-bootstrap";
import Dropdown from "react-bootstrap/Dropdown";
import { OutputType } from "../types/output";
import Button from "react-bootstrap/Button";
import ModelSelectionModal from "./ModelSelectionModal";
import VariableInputModal from "./VariableInputModal"; // Import the modal for variables


export default function Home() {
  const [prompts, setPrompts] = useState<Array<PromptType>>([]);
  const { isAuthenticated } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showVarModal, setShowVarModal] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string | null>(null); // Store selected model
  const [variables, setVariables] = useState<Array<string>>([]); // Store variables from prompt content
  const [variableValues, setVariableValues] = useState<{ [key: string]: string }>({}); // Store input values for variables

  const [selectedPrompt, setSelectedPrompt] = useState<PromptType | null>(null);

  useEffect(() => {
    async function onLoad() {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        const prompts = await loadPrompts();
        setPrompts(prompts);
      } catch (e) {
        onError(e);
      }

      setIsLoading(false);
    }

    onLoad();
  }, [isAuthenticated]);

  function loadPrompts() {
    return API.get("prompts", "/prompts", {}).then(response => {
      console.log("API Response:", response);
      return response;
    });
  }
  

  function formatDate(str: undefined | string) {
    return !str ? "" : new Date(str).toLocaleDateString();
  }

  function truncateText(text: string, maxLength: number) {
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + "...";
    }
    return text;
  }

  function extractVariables(content: string): string[] {
    const matches = content.match(/@\w+/g) || [];
    return matches.map((variable) => variable.slice(1)); // Remove '@' from variable names
  }
  

  function deletePrompt(promptId: string | undefined) {
    return API.del("prompts", `/prompts/${promptId}`, {});
  }

  async function handleDelete(event: React.MouseEvent<HTMLElement>, promptId: string | undefined) {
    event.preventDefault();

    const confirmed = window.confirm(
      "Are you sure you want to delete this prompt?"
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      await deletePrompt(promptId);
      setPrompts(prompts.filter(prompt => prompt.promptId !== promptId));
      setIsDeleting(false);
    } catch (e) {
      onError(e);
      setIsDeleting(false);
    }
  }

  function createOutput(output: OutputType) {
    return API.post("outputs", `prompts/${output.promptId}/outputs`, {
      body: output,
    });
  }

  async function handleSaveVariables() {
    if (!selectedPrompt || !selectedModel) return;

    // Replace variables in the prompt content
    let updatedContent = selectedPrompt.content;
    Object.keys(variableValues).forEach((variable) => {
      updatedContent = updatedContent.replace(`@${variable}`, variableValues[variable]);
    });

    try {
      const response = await API.post("submit", "/submit", {
        body: { prompt: updatedContent, model: selectedModel },
      });

      // Handle response (e.g., save output to the database)
      const generatedTexts = response[0];
      const outputContent = generatedTexts?.generated_text || "No content generated";
      const newOutput = {
        promptId: selectedPrompt.promptId,
        title: selectedPrompt.description,
        content: outputContent,
      };

      await createOutput(newOutput);
    } catch (e) {
      onError(e);
    } finally {
      setShowVarModal(false); // Close the variable modal
      setShowModal(false);
    }
  }

  function handleRun(promptId: string | undefined, description: string | undefined) {
    // Open the modal and set the selected prompt
    const selectedPrompt = prompts.find((p) => p.promptId === promptId);
    setSelectedPrompt(selectedPrompt || null);
    setShowModal(true);
  }

  async function handleRunModel(model: string) {
    if (!selectedPrompt) return;
  
    // Store the selected model
    setSelectedModel(model);
  
    // Extract variables from the prompt content
    const extractedVariables = extractVariables(selectedPrompt.content || "");
    setVariables(extractedVariables);
  
    if (extractedVariables.length === 0) {
      await handleSaveVariables();  // No variables, so just run the prompt
    } else {
      // Show the variable modal if there are variables to fill
      setShowModal(false);
      setShowVarModal(true);
    }
  }
  


  function renderPromptsList(prompts: PromptType[]) {
    return (
      <>
        {prompts.map(({ promptId, description, content, createdAt }) => (
          <ListGroup.Item key={promptId} action className="prompts-card">
            <div className="card-header">
              <LinkContainer to={`/prompts/${promptId}`}>
                <div className="prompt-title">{truncateText(JSON.stringify(content) ?? "", 20)}</div>
              </LinkContainer>
              <Dropdown>
                <Dropdown.Toggle as={Button} variant="link" className="custom-dropdown-toggle">
                  <BsThreeDotsVertical />
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => handleRun(promptId, description)}>Run</Dropdown.Item>
                  <Dropdown.Item onClick={(e) => handleDelete(e, promptId)}>Delete</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
            <div className="card-content">
              <small className="text-muted">{truncateText(description ?? "", 20)}</small>
            </div>
            <div className="card-content">
              <small className="text-muted">Created: {formatDate(createdAt)}</small>
            </div>
          </ListGroup.Item>
        ))}
      </>
    );
  }
  
  function renderLander() {
    return (
      <div className="lander">
        <h1>Build now and save for later!</h1>
        <p>Store prompts easily with the models you want. Tinker is a website powered by Hugging Face where you can build AI prompts with the models you want to reuse later!</p>
      </div>
    );
  }

  function createPrompt() {
    return (
      <LinkContainer to="/prompts/new">
        <ListGroup.Item action className="create-prompt-btn">
          <BsPencilSquare size={17} />
          <span className="ms-2 fw-bold">Create a new prompt</span>
        </ListGroup.Item>
      </LinkContainer>
    );
  }

  function renderPrompts() {
    return (
      <>
        {createPrompt()}
        <div className="prompts-container">
          <h2 className="pb-3 mt-4 mb-3 border-bottom">Your Prompts</h2>
          <div className="prompts-grid">
            {!isLoading && renderPromptsList(prompts)}
          </div>
        </div>
        {/* Model Selection Modal */}
        <ModelSelectionModal
          show={showModal}
          handleClose={() => setShowModal(false)}
          handleRun={handleRunModel} // Runs when the model is selected
        />
        
        {/* Variable Input Modal */}
        <VariableInputModal
          show={showVarModal}
          handleClose={() => setShowVarModal(false)}
          handleSave={handleSaveVariables} // Save variables and run final output
          variables={variables}
          variableValues={variableValues}
          setVariableValues={setVariableValues}
        />
      </>
    );
  }

  return (
    <div className="Home">
      {isAuthenticated ? renderPrompts() : renderLander()}
    </div>
  );
}