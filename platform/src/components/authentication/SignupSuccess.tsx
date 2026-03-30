import { Link } from "react-router-dom";

const SignupSuccess = () => {
  return (
    <>
      <h1>Sign Up Successful!</h1>
      <p>
        Please verify your email using the link provided, then login{" "}
        <Link to="/signin">here!</Link>
      </p>
    </>
  );
};

export default SignupSuccess;
