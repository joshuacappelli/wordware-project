import React, { useState } from "react";
import Form from "react-bootstrap/Form";
import Stack from "react-bootstrap/Stack";
import LoaderButton from "../components/LoaderButton.tsx";
import "./Login.css";
import { Auth } from "aws-amplify";
import { useAppContext } from "../lib/contextLib";
import { onError } from "../lib/errorLib";
import { useFormFields } from "../lib/hooksLib";

export default function Login() {

  const { userHasAuthenticated } = useAppContext();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");  originally we use two seperate state hooks for the email and password

  const [fields, handleFieldChange] = useFormFields({
    email: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  function validateForm() {
  // using the original hooks this is what validation would look like  return email.length > 0 && password.length > 0;
    return fields.email.length > 0 && fields.password.length > 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
  
    setIsLoading(true);
  
    try {
      // Ensure that the sign-in process is awaited
      await Auth.signIn(fields.email, fields.password);
      userHasAuthenticated(true);
    } catch (error) {
      onError(error);
      setIsLoading(false); // Ensure loading stops on error
    }
  }
  

  return (
    <div className="Login">
      <Form onSubmit={handleSubmit}>
        <Stack gap={3}>
          <Form.Group controlId="email">   {/* look up controlled controlled components to learn more about the pattern of displaying the current form value as a state varaible and setting the new one when a user types something */}
            <Form.Label>Email</Form.Label>
            <Form.Control
              autoFocus
              size="lg"
              type="email"
            //   value={email}
            //   onChange={(e) => setEmail(e.target.value)}
              value={fields.email}
              onChange={handleFieldChange}
            />
          </Form.Group>
          <Form.Group controlId="password">
            <Form.Label>Password</Form.Label>
            <Form.Control
              size="lg"
              type="password"
            //   value={password}
            //   onChange={(e) => setPassword(e.target.value)}
              value={fields.password}
              onChange={handleFieldChange}
            />
          </Form.Group>
            <LoaderButton
            size="lg"
            type="submit"
            isLoading={isLoading}
            disabled={!validateForm()}
            >
            Login
            </LoaderButton>
        </Stack>
      </Form>
    </div>
  );
}