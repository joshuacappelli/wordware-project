import { useState, useEffect } from "react";
import ListGroup from "react-bootstrap/ListGroup";
import { useAppContext } from "../lib/contextLib";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import { API } from "aws-amplify";
import { PromptType } from "../types/prompt";
import { onError } from "../lib/errorLib";
import { BsPencilSquare, BsThreeDotsVertical } from "react-icons/bs";
import { LinkContainer } from "react-router-bootstrap";
import Dropdown from "react-bootstrap/Dropdown";
import { OutputType } from "../types/output";
import ModelSelectionModal from "./ModelSelectionModal";

export default function Home() {
  const [prompts, setPrompts] = useState<Array<PromptType>>([]);
  const { isAuthenticated } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
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
    return API.get("prompts", "/prompts", {});
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

  function handleRun(promptId: string | undefined, description: string | undefined) {
    // Open the modal and set the selected prompt
    const selectedPrompt = prompts.find((p) => p.promptId === promptId);
    setSelectedPrompt(selectedPrompt || null);
    setShowModal(true);
  }

  async function handleRunModel(model: string) {
    if (!selectedPrompt) return;

    try {
      const response = await API.post("submit", "/submit", {
        body: { prompt: selectedPrompt.content, model },
      });

      const outputContent = response.data?.generated_text || "No content generated";
      const newOutput = {
        promptId: selectedPrompt.promptId,
        title: selectedPrompt.description,
        content: outputContent,
      };

      await createOutput(newOutput);

      // You can add further actions here, like updating the UI or redirecting the user.
    } catch (e) {
      onError(e);
    } finally {
      setShowModal(false);
    }
  }

  function renderPromptsList(prompts: PromptType[]) {
    return (
      <>
        {prompts.map(({ promptId, description, content, createdAt }) => (
          <ListGroup.Item key={promptId} action className="prompts-card">
            <div className="card-header d-flex justify-content-between">
              <LinkContainer to={`/prompts/${promptId}`}>
                <div className="card-link">{truncateText(content ?? "", 20)}</div>
              </LinkContainer>
              <Dropdown>
                <Dropdown.Toggle as={BsThreeDotsVertical} id={`dropdown-${promptId}`} />
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
        <ModelSelectionModal
          show={showModal}
          handleClose={() => setShowModal(false)}
          handleRun={handleRunModel}
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