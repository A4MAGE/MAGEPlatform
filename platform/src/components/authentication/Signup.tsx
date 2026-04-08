import { useState } from "react";
import SignupForm from "./SignupForm";
import SignupSuccess from "./SignupSuccess";

const Signup = () => {
  const [signupSuccess, setSignupSuccess] = useState(false);

  return (
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
          {signupSuccess ? (
            <SignupSuccess />
          ) : (
            <SignupForm setSignupSuccess={setSignupSuccess} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;
