import React, { useEffect, useState } from "react";
import OtpInput from "otp-input-react";
// import { useNavigate } from "react-router-dom";
import { auth } from "./firebase.config";
import { onAuthStateChanged } from "firebase/auth";

const OtpVerification = () => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  // const navigate = useNavigate();


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log(user.phoneNumber, "<-- auth user");
      } else {
        console.log("No user is currently signed in.");
      }
    });

    return () => unsubscribe();
  }, []);

  function OtpVerify(e) {
    e.preventDefault();
    setLoading(true);
    window.confirmationResult
      .confirm(otp)
      .then(async (res) => {
        console.log(res);
        setLoading(false);
        // navigate("/dashboard");
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }
  return (
    <div>
      <label htmlFor="ph">Enter Your otp</label>
      <form action="" onSubmit={OtpVerify}>
        <OtpInput
          value={otp}
          onChange={setOtp}
          OTPLength={6}
          otpType="number"
          disabled={false}
          autoFocus
        ></OtpInput>
        <button type="submit">Verify Otp</button>
      </form>

      {loading && <h2>Loading...</h2>}
    </div>
  );
};

export default OtpVerification;
