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
        navigate("/dashboard");
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
        <form className="account-form" onSubmit={(e) => handleSignIn(e)}>
          <h2>Sign into the MAGE Platform!</h2>
          <p>
            Don't have an account? Register <Link to="/signup">here</Link>
          </p>
          <div className="signup-input-container">
            <input onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
            <input
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
            />
            <button className="link-button" type="submit" disabled={loading}>
              Sign In
            </button>
          </div>
        </form>
        {error && <p>{error}</p>}
      </div>
    </div>
  );
};

export default Signin;
