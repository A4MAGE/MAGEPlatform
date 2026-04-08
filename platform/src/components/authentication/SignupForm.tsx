import { Link } from "react-router-dom";
import { useState } from "react";
import { UserAuth } from "../../context/AuthContext";

const SignupForm = ({ setSignupSuccess }: { setSignupSuccess: (state: boolean) => void }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { signUpNewUser } = UserAuth();

  const handleSignUp = async (e: any) => {
    e.preventDefault();

    setLoading(true);
    try {
      const result = await signUpNewUser(email, password);

      if (result.success) {
        setLoading(false);
        setSignupSuccess(true);
      } else {
        console.log(result.data);
        throw new Error(result.data.message);
      }
    } catch (error) {
      setError(`${error}`);
      setLoading(false);
    }
  };

  return (
    <form className="account-form" onSubmit={handleSignUp} noValidate>
      <h2>Create your MAGE account</h2>
      <p>
        Already registered? <Link to="/signin">Sign in</Link>
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
          autoComplete="new-password"
          required
          aria-label="Password"
        />
        <button className="link-button" type="submit" disabled={loading}>
          {loading ? "Creating account…" : "Sign Up"}
        </button>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
};

export default SignupForm;
