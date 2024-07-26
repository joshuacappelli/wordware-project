import { useState, useEffect } from "react";
import ListGroup from "react-bootstrap/ListGroup";
import { useAppContext } from "../lib/contextLib";
import "./Home.css";
import { API } from "aws-amplify";
import { PromptType } from "../types/prompt";
import { onError } from "../lib/errorLib";
import { BsPencilSquare } from "react-icons/bs";
import { LinkContainer } from "react-router-bootstrap";

export default function Home() {
  const [prompts, setPrompts] = useState<Array<PromptType>>([]);
  const { isAuthenticated } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function onLoad() {
      if (!isAuthenticated) {
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
    return !str ? "" : new Date(str).toLocaleString();
  }
  
  function renderPromptsList(prompts: PromptType[]) {
    return (
      <>
        <LinkContainer to="/prompts/new">
          <ListGroup.Item action className="py-3 text-nowrap text-truncate">
            <BsPencilSquare size={17} />
            <span className="ms-2 fw-bold">Create a new prompt</span>
          </ListGroup.Item>
        </LinkContainer>
        {prompts.map(({ promptId, content, createdAt }) => (
          <LinkContainer key={promptId} to={`/prompts/${promptId}`}>
            <ListGroup.Item action className="text-nowrap text-truncate">
              <span className="fw-bold">{content.trim().split("\n")[0]}</span>
              <br />
              <span className="text-muted">
                Created: {formatDate(createdAt)}
              </span>
            </ListGroup.Item>
          </LinkContainer>
        ))}
      </>
    );
  }

  function renderLander() {
    return (
      <div className="lander">
        <h1>Tinker</h1>
        <p className="text-muted">An app for making custome prompts through Hugging face</p>
      </div>
    );
  }

  function renderPrompts() {
    return (
      <div className="prompts">
        <h2 className="pb-3 mt-4 mb-3 border-bottom">Your Prompts</h2>
        <ListGroup>{!isLoading && renderPromptsList(prompts)}</ListGroup>
      </div>
    );
  }

  return (
    <div className="Home">
      {isAuthenticated ? renderPrompts() : renderLander()}
    </div>
  );
}