import { Link } from "react-router-dom";

const SignupSuccess = ({ next }: { next?: string }) => {
  const signinHref = next ? `/signin?next=${encodeURIComponent(next)}` : "/signin";
  return (
    <>
      <p className="mage-eyebrow">Account created</p>
      <h2 className="mage-title">Check your inbox</h2>
      <p className="mage-body">
        We sent a verification link to your email. Once you confirm, you can{" "}
        <Link to={signinHref} className="mage-link">sign in</Link>.
      </p>
    </>
  );
};

export default SignupSuccess;
