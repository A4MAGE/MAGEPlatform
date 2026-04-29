import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { UserAuth } from "../../context/AuthContext";
import { useState } from "react";
// @ts-ignore — shared homepage components
import Navbar from "@homepage/components/Navbar";
// @ts-ignore
import SynthwaveBg from "@homepage/components/SynthwaveBg";
// @ts-ignore
import Footer from "@homepage/components/Footer";
import "@homepage/App.css";

const Signin = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn } = UserAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn(email, password);
      if (result.success) {
        const next = searchParams.get("next");
        navigate(next && next.startsWith("/") ? next : "/profile");
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
      <SynthwaveBg />
      <Navbar />
      <div className="mage-shell">
      <div className="mage-split">
        <div className="mage-split__brand">
          <h1 className="mage-wordmark">MAGE</h1>
          <p className="mage-tagline">
            Musical Autonomous<br />
            <strong>Generated Environments</strong>
          </p>
        </div>

        <div className="mage-split__form">
          <p className="mage-eyebrow">Sign in</p>

          <form className="mage-form" onSubmit={handleSignIn} noValidate>
            <div className="mage-field">
              <label className="mage-field__label" htmlFor="signin-email">
                Email
              </label>
              <input
                id="signin-email"
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
              <label className="mage-field__label" htmlFor="signin-password">
                Password
              </label>
              <input
                id="signin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
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
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mage-body">
            First time here? <Link to={searchParams.get("next") ? `/signup?next=${encodeURIComponent(searchParams.get("next")!)}` : "/signup"} className="mage-link">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
      <Footer />
    </>
  );
};

export default Signin;
