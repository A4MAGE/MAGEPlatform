import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import Signup from "./components/authentication/Signup";
import Signin from "./components/authentication/Signin";
import PrivateRoute from "./components/authentication/PrivateRoute";
import Explore from "./components/Explore";
import Player from "./components/Player";
import MyPresets from "./components/MyPresets";
import Broadcast from "./components/Broadcast";
import Profile from "./components/Profile";
import SidebarLayout from "./components/SidebarLayout";
import { AuthContextProvider } from "./context/AuthContext";
// @ts-ignore — homepage's full app with Navbar + Routes (their code, untouched)
import HomepageApp from "@homepage/App";

const AuthLayout = () => (
  <AuthContextProvider>
    <Outlet />
  </AuthContextProvider>
);

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      // Public pages — no sidebar
      { path: "/signup", element: <Signup /> },
      { path: "/signin", element: <Signin /> },
      { path: "/login", element: <Navigate to="/signin" replace /> },

      // Authenticated pages — sidebar layout
      {
        element: (
          <PrivateRoute>
            <SidebarLayout />
          </PrivateRoute>
        ),
        children: [
          { path: "/profile", element: <Profile /> },
          // Legacy /dashboard redirect — Profile replaced it
          { path: "/dashboard", element: <Navigate to="/profile" replace /> },
          { path: "/explore", element: <Explore /> },
          { path: "/player", element: <Player /> },
          { path: "/my-presets", element: <MyPresets /> },
          { path: "/broadcast", element: <Broadcast /> },
        ],
      },

      // Homepage catch-all
      { path: "/*", element: <HomepageApp /> },
    ],
  },
]);
