import React, { useState } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { auth, db } from "./firebase.config";
import { RecaptchaVerifier, signInWithPhoneNumber, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import OtpInput from "otp-input-react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import "./style.css"

const Demo = () => {
  const [ph, setPh] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);

  const navigate = useNavigate();

  const oncaptchaverify = () => {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
    });
  };

  const onSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formatPh = "+" + ph;

    oncaptchaverify();
    const appVerifier = window.recaptchaVerifier;

    signInWithPhoneNumber(auth, formatPh, appVerifier)
      .then((confirmationResult) => {
        window.confirmationResult = confirmationResult;
        setLoading(false);
        setIsOtpSent(true);
        console.log("Otp Sent");
      })
      .catch((error) => {
        console.error("Error during signInWithPhoneNumber:", error);
        setLoading(false);
      });
  };

  const OtpVerify = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    window.confirmationResult
      .confirm(otp)
      .then(async (res) => {
        const userPhone = res.user.phoneNumber;

        const usersCollection = collection(db, "users");
        const q = query(usersCollection, where("phone", "==", userPhone));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError("User not found in our records.");
          setLoading(false);
        } else {
          const user = querySnapshot.docs[0].data();
          if (user.role && user.role.includes("admin")) {
            navigate("/dashboard");
          } else {
            setLoading(false);
            setError("This user is not an admin.");
          }
        }
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
        setError("Invalid OTP.");
      });
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const usersCollection = collection(db, "users");
      const q = query(usersCollection, where("email", "==", user.email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("User not found in our records.");
        setLoading(false);
      } else {
        const userData = querySnapshot.docs[0].data();
        if (userData.role && userData.role.includes("admin")) {
          navigate("/dashboard");
        } else {
          setLoading(false);
          setError("This user is not an admin.");
        }
      }
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      setLoading(false);
      setError("Google sign-in failed.");
    }
  };

  return (
    <>
      <div className="container-fluid demo-container">
        <div id="recaptcha-container"></div>
        <div className="demo-card card">
          <div className="card-body">

            <form onSubmit={onSignup}>
              <label htmlFor="ph">Verify Your Phone Number</label>
              <PhoneInput country={"in"} value={ph} onChange={setPh} disabled={isOtpSent}
              />
              <button className="btn btn-primary btn-sm mt-2" type="submit" disabled={isOtpSent}>Send OTP</button>
            </form>

            <label htmlFor="otp" className="my-2">Enter Your OTP</label>
            <form onSubmit={OtpVerify}>
              <OtpInput
                value={otp}
                onChange={setOtp}
                OTPLength={6}
                otpType="number"
                disabled={!isOtpSent}
                autoFocus
              ></OtpInput>
              <button type="submit" className="btn btn-primary btn-sm mt-2" disabled={!isOtpSent}>Verify OTP</button>
            </form>
            <br />

            <button onClick={handleGoogleSignIn} className="btn btn-success">Sign in with Google</button>
          </div>
          <div className="container-fluid">
            {error && <p style={{ color: "red" }}>{error || "hlllo"}</p>}
            {loading && <h2>Loading....</h2>}
          </div>
        </div>
      </div>
    </>
  );
};

export default Demo;
