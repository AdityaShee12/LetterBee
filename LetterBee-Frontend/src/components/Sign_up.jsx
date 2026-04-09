import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/user.service.jsx";
import {
  setUserId,
  setUserName,
  setUserAvatar,
  setUserAbout,
} from "../features/userSlice";
import { useDispatch } from "react-redux";
import { BACKEND_API } from "../Backend_API.js";
import socket from "../socket.js";
import { useEffect } from "react";

const Sign_up = () => {
  const [profilepic, setProfilepic] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [id, setId] = useState("");
  const [otpSent, setOtpSent] = useState(true);
  const [otpVerified, setotpVerified] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);
  const [fullName, setFullName] = useState("");
  const [userName, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [about, setAbout] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const login = () => {
    window.open(`${BACKEND_API}/auth/google`, "_self");
  };

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

  const loadingFunc = () => {
    setLoading(true);
  };

  const errorHandler = ({ error }) => {
    setLoading(false);
    if (error === "Email is required") {
      setErrorMessage("Email is required");
    }
    else if (error === "Otp is required") {
      setErrorMessage(error);
    }
    else if (error === "An error occurred while sending OTP to the email") {
      setErrorMessage(error);
    }
    else if (error === "Given otp is incorrect") {
      setErrorMessage("Given otp is incorrect");
    }
    else if (error === "Password must be 8+ chars, include uppercase, lowercase, number, special char") {
      setErrorMessage(error);
    }
    else if (error === "Weak Password") {
      setErrorMessage(error);
    }
    else if (error === "This email already has an account") {
      setErrorMessage(error);
    };
  }

  useEffect(() => {
    socket.on("otpError", errorHandler);
    socket.on("verified", (data) => {
      const { verified } = data;

      if (verified) {
        setLoading(false);
        setotpVerified(false);
        setCreateAccount(true);
      }
    })
    socket.on("otpVerified", () => {
      setLoading(false);
      setOtpSent(false);
      setotpVerified(true);
    })
  }, []);

  const sendOtp = async () => {
    try {
      loadingFunc();
      const response = await axios.post(`${BACKEND_API}/api/v1/users/otp`, { email });
      if (response.data.data.id) {
        setOtpSent(false);
        setId(response.data.data.id);
        setotpVerified(true);
        setLoading(false);
      }
    } catch (error) {
      if (error) {
        const errorResponse = error.response.data.message;
        if (errorResponse === "This email already has an account") {
          errorHandler({ error: "This email already has an account" })
        }
        else {
          errorHandler({ error: "An error occurred while sending OTP to the email" })
        };
      }
    }
  };

  const verify = async () => {
    if (otp) {
      loadingFunc();
      const verify = await axios.post(`${BACKEND_API}/api/v1/users/verify`, { id, otp });
      if (verify.data.data) {
        setotpVerified(false);
        setLoading(false);
        setCreateAccount(true);
      } else {
        errorHandler("Given otp is incorrect");
      }
    }
    else {
      errorHandler({ error: "Otp is required" });
    }
  };

  const signIn = () => navigate("/sign_in");

  const chooseAvatar = () => {
    setCreateAccount(false);
    setProfilepic(true);
  };

  const handleRegister = async (e) => {
    loadingFunc();
    e.preventDefault();
    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("userName", userName);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("about", about);
    if (avatar) formData.append("avatar", avatar);
    try {
      const response = await registerUser(formData);
      dispatch(setUserId({ userId: response.data._id }));
      dispatch(setUserName({ userName: response.data.fullName }));
      dispatch(setUserAvatar({ userAvatar: response.data.avatar }));
      dispatch(setUserAbout({ userAbout: response.data.about }));
      navigate("/layout");
    } catch (error) {
      const errorResponse = error.response.data.message;
      if (errorResponse === "Weak Password") {
        errorHandler({ error: "Weak Password" });
      }
      setLoading(false);
    }
  };

  const onClose = () => {
    setErrorMessage("");
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        .signup-root * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .signup-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          background: #0d0d0f;
          position: relative;
          overflow: hidden;
        }

        /* Animated background blobs */
        .bg-blob {
          position: fixed;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.18;
          animation: blobFloat 12s ease-in-out infinite alternate;
          pointer-events: none;
          z-index: 0;
        }
        .bg-blob-1 {
          width: 520px; height: 520px;
          background: #4337e6;
          top: -120px; left: -120px;
          animation-delay: 0s;
        }
        .bg-blob-2 {
          width: 380px; height: 380px;
          background: #a78bfa;
          bottom: -80px; right: -80px;
          animation-delay: -4s;
        }
        .bg-blob-3 {
          width: 260px; height: 260px;
          background: #38bdf8;
          top: 50%; left: 55%;
          animation-delay: -8s;
        }
        @keyframes blobFloat {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(30px, 40px) scale(1.08); }
        }

        /* Grain overlay */
        .grain-overlay {
          position: fixed;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 180px;
          opacity: 0.5;
        }

        /* Loading screen */
        .loading-screen {
          position: fixed;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #0d0d0f;
          z-index: 100;
        }
        .loader-ring {
          width: 52px; height: 52px;
          border: 3px solid rgba(67,55,230,0.2);
          border-top-color: #4337e6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-text {
          margin-top: 18px;
          color: rgba(255,255,255,0.35);
          font-size: 13px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 500;
        }

        /* Page layout */
        .page-wrapper {
          position: relative;
          z-index: 2;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
        }

        .content-column {
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          animation: fadeUp 0.5s ease both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Main card */
        .main-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 36px 32px 32px;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .brand-logo {
          width: 180px;
          margin-bottom: 8px;
          filter: brightness(0) invert(1);
          opacity: 0.92;
        }

        .brand-tagline {
          font-family: 'Playfair Display', serif;
          color: rgba(255,255,255,0.38);
          font-size: 14px;
          text-align: center;
          line-height: 1.5;
          margin-bottom: 28px;
          font-weight: 400;
          max-width: 280px;
        }

        /* Divider */
        .divider {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .divider-line {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.08);
        }
        .divider-text {
          font-size: 11px;
          color: rgba(255,255,255,0.22);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 500;
          white-space: nowrap;
        }

        /* Form fields full width wrapper */
        .fields-wrapper {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0;
          align-items: center;
        }

        /* Google button */
        .btn-google {
          width: 100%;
          max-width: 340px;
          height: 48px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: rgba(255,255,255,0.82);
          font-size: 14.5px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, transform 0.15s;
          letter-spacing: 0.01em;
          margin-bottom: 20px;
        }
        .btn-google:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.18);
          transform: translateY(-1px);
        }
        .btn-google:active { transform: translateY(0); }
        .google-icon {
          width: 20px; height: 20px;
          border-radius: 4px;
          object-fit: cover;
        }

        /* Input field */
        .field-wrap {
          position: relative;
          width: 100%;
          max-width: 340px;
          margin-bottom: 20px;
        }
        .field-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 12px;
          padding: 13px 16px;
          color: rgba(255,255,255,0.9);
          font-size: 14.5px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .field-input::placeholder { color: rgba(255,255,255,0.22); }
        .field-input:focus {
          border-color: rgba(67,55,230,0.7);
          background: rgba(67,55,230,0.06);
        }
        /* Remove number input arrows */
        .field-input[type=number]::-webkit-inner-spin-button,
        .field-input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        .field-input[type=number] { -moz-appearance: textfield; }

        /* Primary button */
        .btn-primary {
          width: 100%;
          max-width: 340px;
          height: 50px;
          background: linear-gradient(135deg, #4337e6 0%, #6d28d9 100%);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          letter-spacing: 0.02em;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 24px rgba(67,55,230,0.35);
          margin-bottom: 0;
        }
        .btn-primary:hover {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 8px 32px rgba(67,55,230,0.45);
        }
        .btn-primary:active { transform: translateY(0); }

        /* Avatar section */
        .avatar-section {
          width: 100%;
          max-width: 340px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
        }
        .avatar-label { cursor: pointer; margin-bottom: 20px; }
        .avatar-ring {
          width: 96px; height: 96px;
          border-radius: 50%;
          background: rgba(67,55,230,0.15);
          border: 2px dashed rgba(67,55,230,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition: border-color 0.2s;
          position: relative;
        }
        .avatar-ring:hover { border-color: rgba(67,55,230,0.8); }
        .avatar-ring img {
          width: 100%; height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }
        .avatar-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
          border-radius: 50%;
        }
        .avatar-ring:hover .avatar-overlay { opacity: 1; }
        .avatar-overlay-text {
          color: #fff;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        /* Footer card */
        .footer-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 18px 24px;
          text-align: center;
          color: rgba(255,255,255,0.35);
          font-size: 14px;
        }
        .footer-card .link {
          color: #7c6ff7;
          cursor: pointer;
          font-weight: 600;
          transition: color 0.18s;
        }
        .footer-card .link:hover { color: #a89ff9; }

        /* Error modal */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 200;
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: fadeIn 0.18s ease both;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .modal-box {
          background: #16161e;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 20px;
          padding: 36px 32px 28px;
          width: 100%;
          max-width: 380px;
          text-align: center;
          animation: scaleIn 0.2s ease both;
        }
        @keyframes scaleIn { from { transform: scale(0.94); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .modal-icon {
          width: 48px; height: 48px;
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          font-size: 20px;
        }
        .modal-title {
          color: #ef4444;
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 10px;
          font-family: 'Playfair Display', serif;
        }
        .modal-msg {
          color: rgba(255,255,255,0.55);
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 24px;
        }
        .modal-btn {
          width: 100%;
          height: 46px;
          background: linear-gradient(135deg, #4337e6, #6d28d9);
          border: none;
          border-radius: 11px;
          color: #fff;
          font-size: 14.5px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .modal-btn:hover { opacity: 0.88; }

        /* Responsive tweaks */
        @media (max-width: 480px) {
          .main-card { padding: 28px 18px 24px; }
          .brand-logo { width: 150px; }
        }
      `}</style>

      <div className="signup-root">
        {/* Background decoration */}
        <div className="bg-blob bg-blob-1" />
        <div className="bg-blob bg-blob-2" />
        <div className="bg-blob bg-blob-3" />
        <div className="grain-overlay" />

        {loading ? (
          <div className="loading-screen">
            <div className="loader-ring" />
            <p className="loading-text">Loading</p>
          </div>
        ) : (
          <div className="page-wrapper">
            <div className="content-column">
              {/* Main card */}
              <div className="main-card">
                <img src="/LetterBee.png" alt="LetterBee" className="brand-logo" />
                <p className="brand-tagline">
                  Sign up to see photos and videos from your friends.
                </p>
                <div className="fields-wrapper">
                  {otpSent && (
                    <>
                      {/* Google login */}
                      <button className="btn-google" onClick={login}>
                        <img src="/googleIcon.jpg" alt="Google" className="google-icon" />
                        Continue with Google
                      </button>

                      {/* OR divider */}
                      <div className="divider" style={{ width: '100%', maxWidth: '340px' }}>
                        <div className="divider-line" />
                        <span className="divider-text">or</span>
                        <div className="divider-line" />
                      </div>

                      {/* Email field */}
                      <div className="field-wrap">
                        <input
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="field-input"
                        />
                      </div>

                      <button onClick={() => {
                        if (!email) {
                          errorHandler({ error: "Email is required" });
                        } else {
                          sendOtp();
                        }
                      }} className="btn-primary" style={{ marginBottom: '4px' }}>
                        Send OTP
                      </button>
                    </>
                  )}
                  {otpVerified && (
                    <>
                      <div className="field-wrap">
                        <input
                          type="number"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="Enter your OTP"
                          className="field-input"
                          style={{ fontSize: '20px', letterSpacing: '0.25em' }}
                        />
                      </div>
                      <button onClick={verify} className="btn-primary" style={{ marginBottom: '4px' }}>
                        Verify OTP
                      </button>
                    </>
                  )}
                  {createAccount && (
                    <>
                      {["Full Name", "Username", "Password"].map((label, i) => (
                        <div className="field-wrap" key={i}>
                          <input
                            type={label === "Password" ? "password" : "text"}
                            placeholder={label}
                            value={
                              label === "Full Name"
                                ? fullName
                                : label === "Username"
                                  ? userName
                                  : password
                            }
                            onChange={(e) => {
                              const value = e.target.value;
                              if (label === "Full Name") {
                                setFullName(value);
                              } else if (label === "Username") {
                                setUsername(value);
                              } else {
                                setPassword(value); // শুধু value set করবে
                              }
                            }}
                            className="field-input"
                          />
                        </div>
                      ))}

                      <button
                        onClick={() => {
                          // validation on button click
                          if (!passwordRegex.test(password)) {
                            setPassword("");
                            errorHandler({ error: "Password must be 8+ chars, include uppercase, lowercase, number, special char" });
                            return;
                          }
                          chooseAvatar();
                        }}
                        className="btn-primary"
                        style={{ marginBottom: "4px" }}
                      >
                        Continue
                      </button>
                    </>
                  )}
                  {profilepic && (
                    <div className="avatar-section">
                      <label className="avatar-label">
                        <div className="avatar-ring">
                          {avatar ? (
                            <img src={URL.createObjectURL(avatar)} alt="avatar" />
                          ) : (
                            <img src="/profileIcon.png" alt="avatar placeholder" />
                          )}
                          <div className="avatar-overlay">
                            <span className="avatar-overlay-text">Change</span>
                          </div>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setAvatar(e.target.files[0])}
                          style={{ display: 'none' }}
                        />
                      </label>

                      <div className="field-wrap">
                        <input
                          value={about}
                          onChange={(e) => setAbout(e.target.value)}
                          placeholder="Write something about yourself..."
                          className="field-input"
                        />
                      </div>

                      <button onClick={handleRegister} className="btn-primary" style={{ marginBottom: '4px' }}>
                        Create Account
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {/* Footer */}
              <div className="footer-card">
                Already have an account?{' '}
                <span className="link" onClick={signIn}>Log in</span>
              </div>
            </div>
          </div>
        )}
        {/* Error Modal */}
        {errorMessage && (
          <div className="modal-backdrop">
            <div className="modal-box">
              <div className="modal-icon">⚠️</div>
              <h2 className="modal-title">Something went wrong</h2>
              <p className="modal-msg">{errorMessage}</p>
              <button className="modal-btn" onClick={onClose}>Got it</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Sign_up;

// return (
//     <div>
//       {loading ? (
//         <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
//           <div className="w-12 h-12 border-4 border-[#4337e6] border-dashed rounded-full animate-spin"></div>
//           <p className="mt-4 text-gray-600 dark:text-gray-300">loading...</p>
//         </div>
//       ) : (
//         <div>
//           <div className="flex flex-col items-center px-2">
//             <div className="border border-slate-400 rounded-md bg-white mt-12 p-8 w-full max-w-[26rem] h-auto sm:h-[35rem] flex flex-col items-center">
//               <img src="/LetterBee.png" alt="" className="w-[18rem]" />

//               <div className="text-lg text-center font-serif text-slate-500 mb-4">
//                 Sign up to see photos and videos from your friends.
//               </div>

//               <div className="w-full flex flex-col items-center">
//                 {otpSent && (
//                   <>
//                     <button
//                       className="bg-[#4337e6] text-white text-lg w-full max-w-[23rem] h-[2.8rem] rounded-xl my-6 flex items-center justify-center gap-3"
//                       onClick={login}>
//                       <img src="/googleIcon.jpg" alt="" className="w-6 h-6" />
//                       Login with Google
//                     </button>

//                     <div className="relative w-full max-w-[23rem]">
//                       <input
//                         type="email"
//                         placeholder="Enter your email"
//                         value={email}
//                         onChange={(e) => setEmail(e.target.value)}
//                         className="w-full px-2 py-1 text-lg outline-none"
//                       />
//                       <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#4337e6]"></div>
//                     </div>

//                     <button
//                       onClick={sendOtp}
//                       className="bg-[#4337e6] text-white text-lg w-full max-w-[23rem] h-[2.8rem] rounded-xl my-6">
//                       Send OTP
//                     </button>
//                   </>
//                 )}
//                 {otpVerified && (
//                   <>
//                     <div className="relative w-full max-w-[23rem]">
//                       <input
//                         type="number"
//                         value={otp}
//                         onChange={(e) => setOtp(e.target.value)}
//                         placeholder="Enter your OTP"
//                         className="w-full px-2 text-2xl outline-none my-[rem]"
//                       />
//                       <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#4337e6]"></div>
//                     </div>

//                     <button
//                       onClick={verify}
//                       className="bg-[#4337e6] text-white text-lg w-full max-w-[23rem] h-[2.8rem] rounded-xl my-6">
//                       Verify your OTP
//                     </button>
//                   </>
//                 )}
//                 {createAccount && (
//                   <>
//                     {["Full Name", "Username", "Password"].map((label, i) => (
//                       <div key={i} className="relative w-full max-w-[23rem] mb-6">
//                         <input
//                           type={label === "Password" ? "password" : "text"}
//                           placeholder={label}
//                           value={
//                             label === "Full Name"
//                               ? fullName
//                               : label === "Username"
//                                 ? userName
//                                 : password
//                           }
//                           onChange={(e) =>
//                             label === "Full Name"
//                               ? setFullName(e.target.value)
//                               : label === "Username"
//                                 ? setUsername(e.target.value)
//                                 : setPassword(e.target.value)
//                           }
//                           className="w-full px-2 py-1 text-lg outline-none"
//                         />
//                         <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#4337e6]"></div>
//                       </div>
//                     ))}

//                     <button
//                       onClick={chooseAvatar}
//                       className="bg-[#4337e6] text-white text-lg w-full max-w-[23rem] h-[2.8rem] rounded-xl my-6">
//                       Next
//                     </button>
//                   </>
//                 )}
//               </div>
//               {profilepic && (
//                 <div className="w-full max-w-[26rem] flex flex-col items-center">
//                   <label className="cursor-pointer">
//                     <div className="bg-slate-300 w-32 h-32 rounded-full flex justify-center items-center mb-4">
//                       {avatar ? (
//                         <img
//                           src={URL.createObjectURL(avatar)}
//                           className="w-full h-full rounded-full object-cover"
//                         />
//                       ) : (
//                         <img
//                           src="/profileIcon.png"
//                           className="w-full h-full rounded-full object-cover"
//                         />
//                       )}
//                     </div>
//                     <input
//                       type="file"
//                       accept="image/*"
//                       onChange={(e) => setAvatar(e.target.files[0])}
//                       className="hidden"
//                     />
//                   </label>

//                   <div className="relative w-full max-w-[23rem]">
//                     <input
//                       value={about}
//                       onChange={(e) => setAbout(e.target.value)}
//                       placeholder="Write something about yourself..."
//                       className="w-full px-3 py-2 text-xl outline-none"
//                     />
//                     <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#4337e6]"></div>
//                   </div>

//                   <button
//                     onClick={handleRegister}
//                     className="bg-[#4337e6] text-white text-lg rounded-xl w-full max-w-[23rem] h-[3rem] my-4">
//                     Next
//                   </button>
//                 </div>
//               )}
//             </div>
//             <p className="text-center text-gray-600 m-7 border border-slate-400 rounded-md p-4 w-full max-w-[26rem] text-lg">
//               Already have an account?{" "}
//               <span className="text-[#4337e6] cursor-pointer" onClick={signIn}>
//                 Login here
//               </span>
//             </p>
//           </div>
//           {errorMessage && (
//             <div className="fixed inset-0 z-50 flex items-center justify-center">
//               {/* Blur Background */}
//               <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
//               {/* Modal Box */}
//               <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-[90%] max-w-md text-center">
//                 <h2 className="text-lg font-semibold text-red-600 mb-4">
//                   Error
//                 </h2>
//                 <p className="text-gray-700 mb-6">{errorMessage}</p>
//                 <button
//                   onClick={onClose}
//                   className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
//                 >
//                   OK
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );