import { Link } from "react-router-dom";
import { useState } from "react";
import { UserAuth } from "../context/AuthContext";

const SignupForm = ({setSignupSuccess} : {setSignupSuccess : (state: boolean) => void}) => {
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
    <>
      <form className="account-form" onSubmit={(e) => handleSignUp(e)}>
        <h2>Sign Up for MAGE Platform!</h2>
        <p>
          Have an account? Login <Link to="/signin">here</Link>
        </p>
        <div className="signup-input-container">
          <input
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
          />
          <input
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
          />
          <button className="link-button" type="submit" disabled={loading}>
            Sign Up
          </button>
        </div>
      </form>
      {error && <p>{error}</p>}
    </>
  );
};

export default SignupForm;