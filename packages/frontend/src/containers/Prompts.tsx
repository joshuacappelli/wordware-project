import React, { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API, Storage } from "aws-amplify";
import { onError } from "../lib/errorLib";
import config from "../config";
import Form from "react-bootstrap/Form";
import { PromptType } from "../types/prompt";
import Stack from "react-bootstrap/Stack";
import LoaderButton from "../components/LoaderButton";
import "./Prompts.css";
import { s3Upload } from "../lib/awsLib";

export default function Prompts() {
  const file = useRef<null | File>(null)
  const { id } = useParams();
  const nav = useNavigate();
  const [prompt, setPrompt] = useState<null | PromptType>(null);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    function loadPrompt() {
      return API.get("prompts", `/prompts/${id}`, {});
    }

    async function onLoad() {
      try {
        const prompt = await loadPrompt();
        const { content, attachment } = prompt;

        if (attachment) {
          prompt.attachmentURL = await Storage.vault.get(attachment);
        }

        setContent(content);
        setPrompt(prompt);
      } catch (e) {
        onError(e);
      }
    }

    onLoad();
  }, [id]);

  function validateForm() {
    return content.length > 0;
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
  
    if (file.current && file.current.size > config.MAX_ATTACHMENT_SIZE) {
      alert(
        `Please pick a file smaller than ${
          config.MAX_ATTACHMENT_SIZE / 1000000
        } MB.`
      );
      return;
    }
  
    setIsLoading(true);
  
    try {
      if (file.current) {
        attachment = await s3Upload(file.current);
      } else if (prompt && prompt.attachment) {
        attachment = prompt.attachment;
      }
  
      await savePrompt({
        content: content,
        attachment: attachment,
      });
      nav("/");
    } catch (e) {
      onError(e);
      setIsLoading(false);
    }
  }
  
  function deletePrompt() {
    return API.del("prompts", `/prompts/${id}`, {});
  }
  
  async function handleDelete(event: React.FormEvent<HTMLModElement>) {
    event.preventDefault();
  
    const confirmed = window.confirm(
      "Are you sure you want to delete this prompt?"
    );
  
    if (!confirmed) {
      return;
    }
  
    setIsDeleting(true);
  
    try {
      await deletePrompt();
      nav("/");
    } catch (e) {
      onError(e);
      setIsDeleting(false);
    }
  }
  
  return (
    <div className="Prompts">
      {prompt && (
        <Form onSubmit={handleSubmit}>
          <Stack gap={3}>
            <Form.Group controlId="content">
              <Form.Control
                size="lg"
                as="textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
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
              <LoaderButton
                size="lg"
                type="submit"
                isLoading={isLoading}
                disabled={!validateForm()}
              >
                Save
              </LoaderButton>
              <LoaderButton
                size="lg"
                variant="danger"
                onClick={handleDelete}
                isLoading={isDeleting}
              >
                Delete
              </LoaderButton>
            </Stack>
          </Stack>
        </Form>
      )}
    </div>
  );
}