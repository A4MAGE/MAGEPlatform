import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Signup from "./components/authentication/Signup";
import Signin from "./components/authentication/Signin";
import Dashboard from "./components/Dashboard";
import PrivateRoute from "./components/authentication/PrivateRoute";
import Explore from "./components/Explore";

export const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/signup", element: <Signup /> },
  { path: "/signin", element: <Signin /> },
  { path: "/explore", element: <Explore /> },
  {
    path: "/dashboard",
    element: (
      <PrivateRoute>
        <Dashboard />
      </PrivateRoute>
    ),
  },
]);
