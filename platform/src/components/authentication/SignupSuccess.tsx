import { Link } from "react-router-dom";

const SignupSuccess = ({ next }: { next?: string }) => {
  const signinHref = next ? `/signin?next=${encodeURIComponent(next)}` : "/signin";
  return (
    <>
      <h2 className="mage-title">Account Created</h2>
      <p className="mage-body">
        Please{" "}
        <Link to={signinHref} className="mage-link">sign in here</Link>.
      </p>
    </>
  );
};

export default SignupSuccess;
