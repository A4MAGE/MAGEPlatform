import { createHashRouter, Navigate, Outlet } from "react-router-dom";
import Signup from "./components/authentication/Signup";
import Signin from "./components/authentication/Signin";
import Dashboard from "./components/Dashboard";
import PrivateRoute from "./components/authentication/PrivateRoute";
import { AuthContextProvider } from "./context/AuthContext";
// @ts-ignore — homepage's full app with Navbar + Routes (their code, untouched)
import HomepageApp from "@homepage/App";

const AuthLayout = () => (
  <AuthContextProvider>
    <Outlet />
  </AuthContextProvider>
);

export const router = createHashRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: "/signup", element: <Signup /> },
      { path: "/signin", element: <Signin /> },
      { path: "/login", element: <Navigate to="/signin" replace /> },
      { path: "/engine", element: <div className="page"><h1 className="page-header">Engine</h1></div> },
      {
        path: "/dashboard",
        element: (
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        ),
      },
      { path: "/*", element: <HomepageApp /> },
    ],
  },
]);
