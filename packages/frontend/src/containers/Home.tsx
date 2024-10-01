import { useState, useEffect, useRef } from "react";
import ListGroup from "react-bootstrap/ListGroup";
import { useAppContext } from "../lib/contextLib";
import "./Home.css";
import axios from "axios";
import { API } from "aws-amplify";
import { PromptType } from "../types/prompt";
import { onError } from "../lib/errorLib";
import { BsPencilSquare, BsThreeDotsVertical } from "react-icons/bs";
import { LinkContainer } from "react-router-bootstrap";
import Dropdown from "react-bootstrap/Dropdown";
import { OutputType } from "../types/output";
import Button from "react-bootstrap/Button";
import ModelSelectionModal from "./ModelSelectionModal";
import VariableInputModal from "./VariableInputModal";
import typewriter from "../components/TypeWriter.tsx"
import CoolButton from '../components/CoolButton';
import { Link } from 'react-router-dom'; // Assuming you're using react-router for navigation
import { s3GetAttachment } from "../lib/awsLib";




export default function Home() {
  const [prompts, setPrompts] = useState<Array<PromptType>>([]);
  const { isAuthenticated } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showVarModal, setShowVarModal] = useState(false);
  const [variables, setVariables] = useState<Array<string>>([]); // Store variables from prompt content
  const [variableValues, setVariableValues] = useState<{ [key: string]: string }>({}); // Store input values for variables
  const selectedModelRef = useRef<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptType | null>(null);

  useEffect(() => {
    async function onLoad() {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }
  
      try {
        setIsLoading(true); // Make sure to show loading until API call completes
        const prompts = await loadPrompts();
        setPrompts(prompts);
      } catch (e) {
        onError(e);
      } finally {
        setIsLoading(false); // Hide loading when everything is done
      }
    }
  
    if (isAuthenticated !== undefined) {
      onLoad();
    }
  }, [isAuthenticated]);
  

  function loadPrompts(): Promise<any> {
    return API.get("prompts", "/prompts", {})
      .then(response => {
        console.log("API Response:", response);
        return response;
      })
      .catch(e => {
        console.error("API Error:", e.message);
        console.error("API Error Details:", {
          config: e.config,
          request: e.request,
          response: e.response,
        });
        throw e;
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


    try {
      await deletePrompt(promptId);
      setPrompts(prompts.filter(prompt => prompt.promptId !== promptId));
    } catch (e) {
      onError(e);
    }
  }

  function createOutput(output: OutputType) {
    return API.post("outputs", `prompts/${output.promptId}/outputs`, {
      body: output,
    });
  }

  async function handleSound() {
    if (!selectedPrompt || !selectedPrompt.attachment) {
      throw new Error("No selected prompt or attachment found");
    }
    try {
      // 1. Get the filename from the selectedPrompt attachment
      const filename = selectedPrompt.attachment; // Assuming attachment contains the filename
      const model = "openai/whisper-large-v3"; // Set the Hugging Face model
      const fileUrl = await s3GetAttachment(filename);
      // console.log("file url is: ", fileUrl);
      // 2. Make the API request to your Lambda function (or another API)
      const response = await API.post("submitSound", "/submitSound", {
        body: { fileUrl, model },
      });
  
      // 3. Handle the response and extract generated text
      const generatedTexts = response.text;
      console.log("generated text is: ", generatedTexts);
      //const outputContent = generatedTexts?.generated_text || "No content generated";
  
      // 4. Build the new output object
      const newOutput = {
        promptId: selectedPrompt.promptId,
        title: selectedPrompt.description,
        content: generatedTexts,
      };
  
      // 5. Save the output using createOutput
      await createOutput(newOutput);
    } catch (e) {
      if (axios.isAxiosError(e)) {
        console.error("Axios error details:", {
          message: e.message,
          code: e.code,
          response: e.response?.data, // The response data from the external API
          status: e.response?.status, // The status code returned
          headers: e.response?.headers, // The response headers
          request: e.config, // Request configuration details
        });
      } else {
        console.error("Unexpected error:", e);
      }
    
    } finally {
      // Close modals after processing
      setShowVarModal(false);
      setShowModal(false);
    }
  }
  

  async function handleSaveVariables() {
    if (!selectedPrompt || !selectedModelRef.current) return;
  
    let updatedContent = selectedPrompt.content;
  
    Object.keys(variableValues).forEach((variable) => {
      updatedContent = updatedContent.replace(`@${variable}`, variableValues[variable]);
    });
  
    try {
      const response = await API.post("submit", "/submit", {
        body: { prompt: updatedContent, model: selectedModelRef.current }, // Use the ref
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
  

  function handleRun(promptId: string | undefined) {
    // Open the modal and set the selected prompt
    const selectedPrompt = prompts.find((p) => p.promptId === promptId);
    setSelectedPrompt(selectedPrompt || null);
    setShowModal(true);
  }

  async function handleRunModel(model: string) {
    if (!selectedPrompt) return;
  
    console.log("setting model to: ", model);
    selectedModelRef.current = model; // Update the ref
  
    if (model === 'openai/whisper-large-v3') {
      console.log("before sound ", model);
      await handleSound();
      return;
    }
  
    const extractedVariables = extractVariables(selectedPrompt.content || "");
    setVariables(extractedVariables);
  
    if (extractedVariables.length === 0) {
      await handleSaveVariables();
    } else {
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
                <div className="prompt-title">{truncateText(content ?? "", 20)}</div>
              </LinkContainer>
              <Dropdown>
                <Dropdown.Toggle as={Button} variant="link" className="custom-dropdown-toggle">
                  <BsThreeDotsVertical />
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => handleRun(promptId)}>Run</Dropdown.Item>
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
    const sentences = ["Write me a story about @Subject","what is this @value @unit in @new_unit", "What are some fun things to do in @location", "give me some facts about @topic"]
    return (
      <>
        <div className="lander">
            <h1 className="lander-title">
                <div>Build now and save for later</div>
                <span className="lander-subtitle">
                Store prompts easily with the models you want. Tinker is a website powered by Hugging Face where you can build AI prompts with the models you want to reuse later!
                </span>
            </h1>
            
        </div>
        <div className="typewriter-container">
            {typewriter(sentences)}
        </div>

        <Link to="/signup">
          <CoolButton>Get Started</CoolButton>
        </Link>
        </>
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