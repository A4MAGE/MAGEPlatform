import { createContext, useEffect, useState, useContext } from "react";
import { supabase } from "../supabaseClient";

type AuthContextType = {
  session: any;
  signUpNewUser: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; data: any }>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; data: any }>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [session, setSession] = useState<any>(undefined);

  // Sign Up Function
  const signUpNewUser = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      console.error(`There was a problem signing up: ${error}`);
      return { success: false, data: error };
    }

    // If the user already had an account, then we can update the session info instantly.
    if (data.user && data.user.identities?.length === 0) {
      return { success: false, data: { message: "User already registered" } };
    }

    return { success: true, data: data };
  };

  // Sign Out Function
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error(`There was a problem signing out: ${error}`);
    }
  };

  // Sign In Function
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;

      return { success: true, data: data };
    } catch (error) {
      console.error(`There was a problem signing in: ${error}`);
      return { success: false, data: error };
    }
  };

  // Setup supabase callbacks. This react code only runs once on mount, then supabase runs the AuthStateChange callback when needed.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // When app exits, this unloads the Supabase auth callback from memory
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, signUpNewUser, signOut, signIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("UserAuth must be used within AuthContextProvider");
  }

  return context;
};
