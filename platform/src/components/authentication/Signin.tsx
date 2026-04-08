import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "../../context/AuthContext";
import "./AccountCreation.css";
import { useState } from "react";

const Signin = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const { signIn } = UserAuth();

  const handleSignIn = async (e: any) => {
    e.preventDefault();

    setLoading(true);
    try {
      const result = await signIn(email, password);

      if (result.success) {
        navigate("/profile");
        setLoading(false);
      } else {
        throw new Error(result.data.message);
      }
    } catch (error) {
      setError(`${error}`);
      setLoading(false);
    }
  };

  return (
    <div className="home-container">
      <div className="content-center-card">
        <form className="account-form" onSubmit={handleSignIn} noValidate>
          <h2>Sign in to MAGE</h2>
          <p>
            Don't have an account? <Link to="/signup">Create one</Link>
          </p>
          <div className="signup-input-container">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              type="email"
              autoComplete="email"
              autoFocus
              required
              aria-label="Email"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              autoComplete="current-password"
              required
              aria-label="Password"
            />
            <button className="link-button" type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Signin;
