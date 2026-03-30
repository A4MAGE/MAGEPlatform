import { createHashRouter, Outlet } from "react-router-dom";
import App from "./App";
import Signup from "./components/authentication/Signup";
import Signin from "./components/authentication/Signin";
import Dashboard from "./components/Dashboard";
import PrivateRoute from "./components/authentication/PrivateRoute";
import Explore from "./components/Explore";
import { AuthContextProvider } from "./context/AuthContext";

const AuthLayout = () => (
  <AuthContextProvider>
    <Outlet />
  </AuthContextProvider>
);

export const router = createHashRouter([
  {
    element: <AuthLayout />,
    children: [
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
    ],
  },
]);
