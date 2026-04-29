import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import SignupForm from "./SignupForm";
import SignupSuccess from "./SignupSuccess";
// @ts-ignore — shared homepage components
import Navbar from "@homepage/components/Navbar";
// @ts-ignore
import SynthwaveBg from "@homepage/components/SynthwaveBg";
// @ts-ignore
import Footer from "@homepage/components/Footer";
import "@homepage/App.css";

const Signup = () => {
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next") ?? "";

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
          {signupSuccess ? (
            <SignupSuccess next={next} />
          ) : (
            <SignupForm setSignupSuccess={setSignupSuccess} />
          )}
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
};

export default Signup;
