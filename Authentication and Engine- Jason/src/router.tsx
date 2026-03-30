import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Signup from "./components/authentication/Signup";
import Signin from "./components/authentication/Signin";
import Dashboard from "./components/Dashboard";
import PrivateRoute from "./components/authentication/PrivateRoute";

export const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/signup", element: <Signup /> },
  { path: "/signin", element: <Signin /> },
  {
    path: "/dashboard",
    element: (
      <PrivateRoute>
        <Dashboard />
      </PrivateRoute>
    ),
  },
]);
