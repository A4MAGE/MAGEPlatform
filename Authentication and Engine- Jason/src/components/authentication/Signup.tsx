import "./AccountCreation.css";
import { useState } from "react";
import SignupForm from "./SignupForm";
import SignupSuccess from "./SignupSuccess";

const Signup = () => {
  const [signupSuccess, setSignupSuccess] = useState(false);
  // Displays message telling user to sign in with their email on successful sign up
  return (
    <div className="home-container">
      <div className="content-center-card">
        {signupSuccess ? <SignupSuccess/> : <SignupForm setSignupSuccess={setSignupSuccess}/>}
      </div>
    </div>
  );
};

export default Signup;
