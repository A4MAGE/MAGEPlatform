import { Link, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { UserAuth } from "../../context/AuthContext";

const SignupForm = ({ setSignupSuccess }: { setSignupSuccess: (state: boolean) => void }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next") ?? "";

  const { signUpNewUser } = UserAuth();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signUpNewUser(email, password);
      if (result.success) {
        setSignupSuccess(true);
      } else {
        throw new Error(result.data.message);
      }
    } catch (err) {
      setError(`${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <p className="mage-eyebrow">Create account</p>

      <form className="mage-form" onSubmit={handleSignUp} noValidate>
        <div className="mage-field">
          <label className="mage-field__label" htmlFor="signup-email">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
            autoComplete="email"
            autoFocus
            required
          />
        </div>

        <div className="mage-field">
          <label className="mage-field__label" htmlFor="signup-password">
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Choose a strong password"
            autoComplete="new-password"
            required
          />
        </div>

        {error && (
          <p className="mage-error" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="mage-btn mage-btn--primary"
          disabled={loading}
        >
          {loading ? "Creating…" : "Create Account"}
        </button>
      </form>

      <p className="mage-body">
        Already have one? <Link to={next ? `/signin?next=${encodeURIComponent(next)}` : "/signin"} className="mage-link">Sign in</Link>
      </p>
    </>
  );
};

export default SignupForm;
