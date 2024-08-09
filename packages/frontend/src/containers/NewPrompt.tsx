import React, { useRef, useState } from "react";
import Form from "react-bootstrap/Form";
import { useNavigate } from "react-router-dom";
import LoaderButton from "../components/LoaderButton";
import config from "../config";
import "./NewPrompt.css";
import { API } from "aws-amplify";
import { PromptType } from "../types/prompt";
import { onError } from "../lib/errorLib";
import { s3Upload } from "../lib/awsLib";

export default function NewPrompt() {
  const file = useRef<null | File>(null);
  const nav = useNavigate();
  const [content, setContent] = useState("Write your prompt here");
  const [description, setDescription] = useState("set your description!");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ content: '', description: '' });

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

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.currentTarget.files === null) return;
    file.current = event.currentTarget.files[0];
  }

  function createPrompt(prompt: PromptType) {
    return API.post("prompts", "/prompts", {
      body: prompt,
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (file.current && file.current.size > config.MAX_ATTACHMENT_SIZE) {
      alert(
        `Please pick a file smaller than ${config.MAX_ATTACHMENT_SIZE / 1000000} MB.`
      );
      return;
    }

    setIsLoading(true);

    try {
      const attachment = file.current
        ? await s3Upload(file.current)
        : undefined;

      await createPrompt({ content, description, attachment });
      nav("/");
    } catch (e) {
      onError(e);
      setIsLoading(false);
    }
  }

  return (
    <div className="NewPrompt">
      <Form onSubmit={handleSubmit}>
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
          <Form.Control onChange={handleFileChange} type="file" />
        </Form.Group>
        <LoaderButton
          size="lg"
          type="submit"
          variant="primary"
          isLoading={isLoading}
          disabled={isLoading} // Disable the button while loading
        >
          Create
        </LoaderButton>
      </Form>
    </div>
  );
}
