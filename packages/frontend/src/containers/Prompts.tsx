import React, { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API, Storage } from "aws-amplify";
import { onError } from "../lib/errorLib";
import config from "../config";
import Form from "react-bootstrap/Form";
import { PromptType } from "../types/prompt";
import { OutputType } from "../types/output";
import Stack from "react-bootstrap/Stack";
import LoaderButton from "../components/LoaderButton";
import "./Prompts.css";
import { s3Upload } from "../lib/awsLib";

// Initialize DynamoDB client
export default function Prompts() {
  const file = useRef<null | File>(null);
  const { id } = useParams();
  const nav = useNavigate();
  const [prompt, setPrompt] = useState<null | PromptType>(null);
  const [content, setContent] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errors, setErrors] = useState({ content: '', description: '' });
  const [outputs, setOutputs] = useState<Array<OutputType>>([]);

  useEffect(() => {
    function loadPrompt() {
      return API.get("prompts", `/prompts/${id}`, {});
    }

    function loadOutputs() {
      return API.get("outputs", `/prompts/${id}/outputs`, {}).then(response => {
        console.log("API Response for outputs:", response);
        return response;
      });
    }

    async function onLoad() {
      try {
        const prompt = await loadPrompt();
        const { content, description, attachment } = prompt;

        if (attachment) {
          prompt.attachmentURL = await Storage.vault.get(attachment);
        }

        const outputs = await loadOutputs();
        setOutputs(outputs);

        setContent(content || "");
        setPrompt(prompt);
        setDescription(description || "");
      } catch (e) {
        onError(e);
      }
    }

    onLoad();
  }, [id]);

  function validateForm() {
    const errors = { content: '', description: '' };
    if (!content.trim()) {
      errors.content = 'Prompt cannot be empty';
    }
    if (!description.trim()) {
      errors.description = 'Description cannot be empty';
    }
    setErrors(errors);
    return !errors.content && !errors.description;
  }

  function formatFilename(str: string) {
    return str.replace(/^\w+-/, "");
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.currentTarget.files === null) return;
    file.current = event.currentTarget.files[0];
  }

  function savePrompt(prompt: PromptType) {
    return API.put("prompts", `/prompts/${id}`, {
      body: prompt,
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    let attachment;

    event.preventDefault();

    // Validate form before proceeding
    if (!validateForm()) {
      return;
    }

    // Validate file size if a file is selected
    if (file.current && file.current.size > config.MAX_ATTACHMENT_SIZE) {
      alert(
        `Please pick a file smaller than ${
          config.MAX_ATTACHMENT_SIZE / 1000000
        } MB.`
      );
      return;
    }

    // Validate that the file is an MP3
    if (file.current && file.current.type !== 'audio/mpeg') {
      alert('Please select an MP3 file.');
      return;
    }

    setIsLoading(true);

    try {
      // Handle file upload if file exists
      if (file.current) {
        attachment = await s3Upload(file.current);
      } else if (prompt && prompt.attachment) {
        attachment = prompt.attachment;
      }

      // Save the prompt with the attached MP3
      await savePrompt({
        ...prompt,
        content: content,
        description: description,
        attachment: attachment,
      });
      
      nav("/");
    } catch (e) {
      onError(e);
      setIsLoading(false);
    }
  }


  async function handleDeleteOutput(output: OutputType) {
    if (!output) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this output?"
    );

    if (!confirmed) {
      return;
    }

    setLoadingId(output.outputId || null); // Set the loading ID to show loader for this specific output

    try {
      await API.del("outputs", `/outputs/${output.promptId}`, {});

      // Remove the deleted output from the outputs list
      setOutputs((prevOutputs) => prevOutputs.filter((out) => out.outputId !== output.outputId));
    } catch (e) {
      onError(e);
    } finally {
      setLoadingId(null); // Reset the loading state
    }
  }

  function deletePrompt() {
    return API.del("prompts", `/prompts/${id}`, {});
  }

  function deleteOutput(output : OutputType) {
    return API.del("outputs", `/outputs/${output.promptId}`, {});
  }


  async function handleDelete(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    const confirmed = window.confirm(
      "Are you sure you want to delete this prompt and all associated outputs?"
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      // Delete the prompt
      await deletePrompt();

      await Promise.all(outputs.map(output => deleteOutput(output)));

      nav("/");
    } catch (e) {
      onError(e);
      setIsDeleting(false);
    }
  }

  return (
    <div className="Prompts">
      {prompt && (
        <>
          <Form onSubmit={handleSubmit}>
            <Stack gap={3}>
              <Form.Group controlId="content">
                <Form.Control
                  value={content}
                  as="textarea"
                  className="main-textarea"
                  onChange={(e) => setContent(e.target.value)}
                  isInvalid={!!errors.content}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.content}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group controlId="description">
                <Form.Control
                  value={description}
                  as="textarea"
                  className="description-textarea"
                  onChange={(e) => setDescription(e.target.value)}
                  isInvalid={!!errors.description}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.description}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mt-2" controlId="file">
                <Form.Label>Attachment</Form.Label>
                {prompt.attachment && (
                  <p>
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href={prompt.attachmentURL}
                    >
                      {formatFilename(prompt.attachment)}
                    </a>
                  </p>
                )}
                <Form.Control onChange={handleFileChange} type="file" />
              </Form.Group>
              <Stack gap={1}>
                <div className="button-group">
                  <LoaderButton
                    size="lg"
                    type="submit"
                    isLoading={isLoading}
                    disabled={isLoading} // Disable the button while loading
                  >
                    Update
                  </LoaderButton>
                  <LoaderButton
                    size="lg"
                    variant="danger"
                    onClick={handleDelete}
                    isLoading={isDeleting}
                  >
                    Delete
                  </LoaderButton>
                </div>
              </Stack>
            </Stack>
          </Form>
          <div className="outputs">
            <h3>Outputs</h3>
            {outputs.map((output) => (
              <div key={output.outputId} className="output">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h1 style={{ marginRight: '10px' }}>
                    {typeof output.title === 'string' ? output.title : JSON.stringify(output.title)}
                  </h1>
                  <LoaderButton
                    variant="danger"
                    onClick={() => handleDeleteOutput(output)}
                    isLoading={loadingId === output.outputId} // Use this state to track loading per output
                  >
                    Delete
                  </LoaderButton>
                </div>
                <p>{typeof output.content === 'string' ? output.content : JSON.stringify(output.content)}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
