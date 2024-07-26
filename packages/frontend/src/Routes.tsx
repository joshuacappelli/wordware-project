import { Route, Routes } from "react-router-dom";
import Home from "./containers/Home.tsx";
import NotFound from "./containers/NotFound.tsx";
import Login from "./containers/Login.tsx";
import Signup from "./containers/Signup.tsx";
import NewPrompt from "./containers/NewPrompt.tsx";
import Prompts from "./containers/Prompts.tsx";
import AuthenticatedRoute from "./components/AuthenticateRoute.tsx";
import UnauthenticatedRoute from "./components/UnauthenticatedRoute.tsx";

export default function Links() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
  path="/login"
  element={
    <UnauthenticatedRoute>
      <Login />
    </UnauthenticatedRoute>
  }
/>
<Route
  path="/signup"
  element={
    <UnauthenticatedRoute>
      <Signup />
    </UnauthenticatedRoute>
  }
/>
<Route
  path="/prompts/new"
  element={
    <AuthenticatedRoute>
      <NewPrompt />
    </AuthenticatedRoute>
  }
/>

<Route
  path="/prompts/:id"
  element={
    <AuthenticatedRoute>
      <Prompts />
    </AuthenticatedRoute>
  }
/>
      {/* Finally, catch all unmatched routes */}
      <Route path="*" element={<NotFound />} />;
    </Routes>
  );
}