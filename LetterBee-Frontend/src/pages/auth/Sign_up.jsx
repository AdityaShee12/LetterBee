import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../../services/auth.service.jsx";
import { useDispatch } from "react-redux";
import { authAPI } from "../../api/api.js";

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

  // const login = () => {
  //   window.open(`${BACKEND_API}/auth/google`, "_self");
  // };

  useEffect(() => {
    console.log(loading, otpVerified, otpSent, id);
  }, [loading, otpVerified]);

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
      console.log("W1");

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

  const sendOtp = async () => {
    try {
      loadingFunc();
      const response = await authAPI.sendOTP({ email });
      if (response?.data.id) {
        setOtpSent(false);
        setId(response.data.id);
        setotpVerified(true);
        setLoading(false);
      }
    } catch (error) {
      console.log(error);
      if (error) {
        const errorResponse = error?.response?.data?.message;
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
    console.log("OTPVY", otp);
    if (otp) {
      loadingFunc();
      try {
        await authAPI.verifyOTP({ id, otp });
        setotpVerified(false);
        setLoading(false);
        setCreateAccount(true);
      } catch (error) {
        errorHandler({ error: "Given otp is incorrect" });
      }
    }
    else {
      errorHandler({ error: "Otp is required" });
    }
  };

  const signIn = () => navigate("/");

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
      await registerUser(formData, dispatch);
      navigate("/layout");
    } catch (error) {
      const errorResponse = error?.response?.data?.message;
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
      <div className="signup-root font-sans min-h-screen bg-[#f0f1f8] relative overflow-hidden">
        {loading ? (
          <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#f0f1f8] z-[100]">
            <div className="w-[52px] h-[52px] border-[3px] border-[#3D4DB7]/20 border-t-[#3D4DB7] rounded-full animate-spin" />
            <p className="mt-[18px] text-[#3D4DB7]/50 text-[13px] tracking-[0.12em] uppercase font-medium">Loading</p>
          </div>
        ) : (
          <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-6">
            <div className="w-full max-w-[420px] flex flex-col gap-3">

              {/* Main card */}
              <div className="bg-white border border-[#d6d8ef] rounded-2xl px-8 py-9 flex flex-col items-center">

                <img src="/LetterBee.png" alt="LetterBee" className="w-44 mb-2 opacity-90" />

                <p className="text-[#888] text-sm text-center leading-relaxed mb-7 max-w-[280px]" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Sign up to see photos and videos from your friends.
                </p>

                <div className="w-full flex flex-col items-center">

                  {/* OTP sent step — email input */}
                  {otpSent && (
                    <>
                      <div className="w-full max-w-[340px] flex items-center gap-3 mb-5">
                        <div className="flex-1 h-px bg-[#d6d8ef]" />
                        <span className="text-[11px] text-[#bbb] tracking-widest uppercase font-medium">or</span>
                        <div className="flex-1 h-px bg-[#d6d8ef]" />
                      </div>

                      <div className="w-full max-w-[340px] mb-5">
                        <input
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-[#f4f5fb] border-[1.5px] border-[#d6d8ef] rounded-xl px-4 py-3 text-[#1a1a2e] text-sm outline-none focus:border-[#3D4DB7] focus:bg-[#eef0fb] placeholder:text-[#aaa] transition-all"
                        />
                      </div>

                      <button
                        onClick={() => {
                          if (!email) {
                            errorHandler({ error: "Email is required" });
                          } else {
                            sendOtp();
                          }
                        }}
                        className="w-full max-w-[340px] h-[50px] bg-[#3D4DB7] hover:bg-[#3041a3] text-white rounded-xl text-[15px] font-semibold tracking-wide transition-all shadow-[0_4px_24px_rgba(61,77,183,0.25)] hover:shadow-[0_8px_32px_rgba(61,77,183,0.35)] hover:-translate-y-px active:translate-y-0 mb-1"
                      >
                        Send OTP
                      </button>
                    </>
                  )}

                  {/* OTP verify step */}
                  {otpVerified && (
                    <>
                      <div className="w-full max-w-[340px] mb-5">
                        <input
                          type="number"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="Enter your OTP"
                          className="w-full bg-[#f4f5fb] border-[1.5px] border-[#d6d8ef] rounded-xl px-4 py-3 text-[#1a1a2e] outline-none focus:border-[#3D4DB7] focus:bg-[#eef0fb] placeholder:text-[#aaa] transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          style={{ fontSize: '20px', letterSpacing: '0.25em' }}
                        />
                      </div>
                      <button
                        onClick={verify}
                        className="w-full max-w-[340px] h-[50px] bg-[#3D4DB7] hover:bg-[#3041a3] text-white rounded-xl text-[15px] font-semibold tracking-wide transition-all shadow-[0_4px_24px_rgba(61,77,183,0.25)] hover:shadow-[0_8px_32px_rgba(61,77,183,0.35)] hover:-translate-y-px active:translate-y-0 mb-1"
                      >
                        Verify OTP
                      </button>
                    </>
                  )}

                  {/* Create account step */}
                  {createAccount && (
                    <>
                      {["Full Name", "Username", "Password"].map((label, i) => (
                        <div className="w-full max-w-[340px] mb-5" key={i}>
                          <input
                            type={label === "Password" ? "password" : "text"}
                            placeholder={label}
                            value={
                              label === "Full Name" ? fullName
                                : label === "Username" ? userName
                                  : password
                            }
                            onChange={(e) => {
                              const value = e.target.value;
                              if (label === "Full Name") setFullName(value);
                              else if (label === "Username") setUsername(value);
                              else setPassword(value);
                            }}
                            className="w-full bg-[#f4f5fb] border-[1.5px] border-[#d6d8ef] rounded-xl px-4 py-3 text-[#1a1a2e] text-sm outline-none focus:border-[#3D4DB7] focus:bg-[#eef0fb] placeholder:text-[#aaa] transition-all"
                          />
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          if (!passwordRegex.test(password)) {
                            setPassword("");
                            errorHandler({ error: "Password must be 8+ chars, include uppercase, lowercase, number, special char" });
                            return;
                          }
                          chooseAvatar();
                        }}
                        className="w-full max-w-[340px] h-[50px] bg-[#3D4DB7] hover:bg-[#3041a3] text-white rounded-xl text-[15px] font-semibold tracking-wide transition-all shadow-[0_4px_24px_rgba(61,77,183,0.25)] hover:shadow-[0_8px_32px_rgba(61,77,183,0.35)] hover:-translate-y-px active:translate-y-0 mb-1"
                      >
                        Continue
                      </button>
                    </>
                  )}

                  {/* Avatar / profile pic step */}
                  {profilepic && (
                    <div className="w-full max-w-[340px] flex flex-col items-center">
                      <label className="cursor-pointer mb-5">
                        <div className="w-24 h-24 rounded-full bg-[#eef0fb] border-2 border-dashed border-[#3D4DB7] flex items-center justify-center overflow-hidden relative group transition-all hover:border-[#3041a3]">
                          {avatar ? (
                            <img src={URL.createObjectURL(avatar)} alt="avatar" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <img src="/profileIcon.png" alt="avatar placeholder" className="w-full h-full object-cover rounded-full" />
                          )}
                          <div className="absolute inset-0 bg-[#3D4DB7]/35 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                            <span className="text-white text-[11px] font-semibold tracking-widest uppercase">Change</span>
                          </div>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setAvatar(e.target.files[0])}
                          className="hidden"
                        />
                      </label>

                      <div className="w-full mb-5">
                        <input
                          value={about}
                          onChange={(e) => setAbout(e.target.value)}
                          placeholder="Write something about yourself..."
                          className="w-full bg-[#f4f5fb] border-[1.5px] border-[#d6d8ef] rounded-xl px-4 py-3 text-[#1a1a2e] text-sm outline-none focus:border-[#3D4DB7] focus:bg-[#eef0fb] placeholder:text-[#aaa] transition-all"
                        />
                      </div>

                      <button
                        onClick={handleRegister}
                        className="w-full h-[50px] bg-[#3D4DB7] hover:bg-[#3041a3] text-white rounded-xl text-[15px] font-semibold tracking-wide transition-all shadow-[0_4px_24px_rgba(61,77,183,0.25)] hover:shadow-[0_8px_32px_rgba(61,77,183,0.35)] hover:-translate-y-px active:translate-y-0 mb-1"
                      >
                        Create Account
                      </button>
                    </div>
                  )}

                </div>
              </div>

              {/* Footer */}
              <div className="bg-white border border-[#d6d8ef] rounded-2xl px-6 py-4 text-center text-[#888] text-sm">
                Already have an account?{' '}
                <span
                  onClick={signIn}
                  className="text-[#3D4DB7] hover:text-[#3041a3] font-semibold cursor-pointer transition-colors"
                >
                  Log in
                </span>
              </div>

            </div>
          </div>
        )}

        {/* Error Modal */}
        {errorMessage && (
          <div className="fixed inset-0 z-[200] bg-[#3D4DB7]/15 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white border border-[#d6d8ef] rounded-2xl px-8 py-9 w-full max-w-[380px] text-center">
              <div className="w-12 h-12 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
                ⚠️
              </div>
              <h2 className="text-red-500 text-base font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                Something went wrong
              </h2>
              <p className="text-[#888] text-sm leading-relaxed mb-6">{errorMessage}</p>
              <button
                onClick={onClose}
                className="w-full h-[46px] bg-[#3D4DB7] hover:bg-[#3041a3] text-white rounded-xl text-sm font-semibold transition-all"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );

};

export default Sign_up;

// return (
//   <>
//     <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

//         .signup-root * {
//           box-sizing: border-box;
//           margin: 0;
//           padding: 0;
//         }

//         .signup-root {
//           font-family: 'DM Sans', sans-serif;
//           min-height: 100vh;
//           background: #0d0d0f;
//           position: relative;
//           overflow: hidden;
//         }

//         /* Animated background blobs */
//         .bg-blob {
//           position: fixed;
//           border-radius: 50%;
//           filter: blur(90px);
//           opacity: 0.18;
//           animation: blobFloat 12s ease-in-out infinite alternate;
//           pointer-events: none;
//           z-index: 0;
//         }
//         .bg-blob-1 {
//           width: 520px; height: 520px;
//           background: #4337e6;
//           top: -120px; left: -120px;
//           animation-delay: 0s;
//         }
//         .bg-blob-2 {
//           width: 380px; height: 380px;
//           background: #a78bfa;
//           bottom: -80px; right: -80px;
//           animation-delay: -4s;
//         }
//         .bg-blob-3 {
//           width: 260px; height: 260px;
//           background: #38bdf8;
//           top: 50%; left: 55%;
//           animation-delay: -8s;
//         }
//         @keyframes blobFloat {
//           0%   { transform: translate(0, 0) scale(1); }
//           100% { transform: translate(30px, 40px) scale(1.08); }
//         }

//         /* Grain overlay */
//         .grain-overlay {
//           position: fixed;
//           inset: 0;
//           z-index: 1;
//           pointer-events: none;
//           background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
//           background-repeat: repeat;
//           background-size: 180px;
//           opacity: 0.5;
//         }

//         /* Loading screen */
//         .loading-screen {
//           position: fixed;
//           inset: 0;
//           display: flex;
//           flex-direction: column;
//           align-items: center;
//           justify-content: center;
//           background: #0d0d0f;
//           z-index: 100;
//         }
//         .loader-ring {
//           width: 52px; height: 52px;
//           border: 3px solid rgba(67,55,230,0.2);
//           border-top-color: #4337e6;
//           border-radius: 50%;
//           animation: spin 0.8s linear infinite;
//         }
//         @keyframes spin { to { transform: rotate(360deg); } }
//         .loading-text {
//           margin-top: 18px;
//           color: rgba(255,255,255,0.35);
//           font-size: 13px;
//           letter-spacing: 0.12em;
//           text-transform: uppercase;
//           font-weight: 500;
//         }

//         /* Page layout */
//         .page-wrapper {
//           position: relative;
//           z-index: 2;
//           min-height: 100vh;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           padding: 24px 16px;
//         }

//         .content-column {
//           width: 100%;
//           max-width: 420px;
//           display: flex;
//           flex-direction: column;
//           gap: 12px;
//           animation: fadeUp 0.5s ease both;
//         }
//         @keyframes fadeUp {
//           from { opacity: 0; transform: translateY(22px); }
//           to   { opacity: 1; transform: translateY(0); }
//         }

//         /* Main card */
//         .main-card {
//           background: rgba(255,255,255,0.04);
//           border: 1px solid rgba(255,255,255,0.08);
//           border-radius: 20px;
//           padding: 36px 32px 32px;
//           backdrop-filter: blur(20px);
//           -webkit-backdrop-filter: blur(20px);
//           display: flex;
//           flex-direction: column;
//           align-items: center;
//         }

//         .brand-logo {
//           width: 180px;
//           margin-bottom: 8px;
//           filter: brightness(0) invert(1);
//           opacity: 0.92;
//         }

//         .brand-tagline {
//           font-family: 'Playfair Display', serif;
//           color: rgba(255,255,255,0.38);
//           font-size: 14px;
//           text-align: center;
//           line-height: 1.5;
//           margin-bottom: 28px;
//           font-weight: 400;
//           max-width: 280px;
//         }

//         /* Divider */
//         .divider {
//           width: 100%;
//           display: flex;
//           align-items: center;
//           gap: 12px;
//           margin-bottom: 20px;
//         }
//         .divider-line {
//           flex: 1;
//           height: 1px;
//           background: rgba(255,255,255,0.08);
//         }
//         .divider-text {
//           font-size: 11px;
//           color: rgba(255,255,255,0.22);
//           letter-spacing: 0.08em;
//           text-transform: uppercase;
//           font-weight: 500;
//           white-space: nowrap;
//         }

//         /* Form fields full width wrapper */
//         .fields-wrapper {
//           width: 100%;
//           display: flex;
//           flex-direction: column;
//           gap: 0;
//           align-items: center;
//         }

//         /* Google button */
//         .btn-google {
//           width: 100%;
//           max-width: 340px;
//           height: 48px;
//           background: rgba(255,255,255,0.06);
//           border: 1px solid rgba(255,255,255,0.1);
//           border-radius: 12px;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           gap: 10px;
//           color: rgba(255,255,255,0.82);
//           font-size: 14.5px;
//           font-weight: 500;
//           cursor: pointer;
//           transition: background 0.2s, border-color 0.2s, transform 0.15s;
//           letter-spacing: 0.01em;
//           margin-bottom: 20px;
//         }
//         .btn-google:hover {
//           background: rgba(255,255,255,0.1);
//           border-color: rgba(255,255,255,0.18);
//           transform: translateY(-1px);
//         }
//         .btn-google:active { transform: translateY(0); }
//         .google-icon {
//           width: 20px; height: 20px;
//           border-radius: 4px;
//           object-fit: cover;
//         }

//         /* Input field */
//         .field-wrap {
//           position: relative;
//           width: 100%;
//           max-width: 340px;
//           margin-bottom: 20px;
//         }
//         .field-input {
//           width: 100%;
//           background: rgba(255,255,255,0.04);
//           border: 1px solid rgba(255,255,255,0.09);
//           border-radius: 12px;
//           padding: 13px 16px;
//           color: rgba(255,255,255,0.9);
//           font-size: 14.5px;
//           font-family: 'DM Sans', sans-serif;
//           outline: none;
//           transition: border-color 0.2s, background 0.2s;
//         }
//         .field-input::placeholder { color: rgba(255,255,255,0.22); }
//         .field-input:focus {
//           border-color: rgba(67,55,230,0.7);
//           background: rgba(67,55,230,0.06);
//         }
//         /* Remove number input arrows */
//         .field-input[type=number]::-webkit-inner-spin-button,
//         .field-input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
//         .field-input[type=number] { -moz-appearance: textfield; }

//         /* Primary button */
//         .btn-primary {
//           width: 100%;
//           max-width: 340px;
//           height: 50px;
//           background: linear-gradient(135deg, #4337e6 0%, #6d28d9 100%);
//           border: none;
//           border-radius: 12px;
//           color: #fff;
//           font-size: 15px;
//           font-weight: 600;
//           font-family: 'DM Sans', sans-serif;
//           cursor: pointer;
//           letter-spacing: 0.02em;
//           transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
//           box-shadow: 0 4px 24px rgba(67,55,230,0.35);
//           margin-bottom: 0;
//         }
//         .btn-primary:hover {
//           opacity: 0.92;
//           transform: translateY(-1px);
//           box-shadow: 0 8px 32px rgba(67,55,230,0.45);
//         }
//         .btn-primary:active { transform: translateY(0); }

//         /* Avatar section */
//         .avatar-section {
//           width: 100%;
//           max-width: 340px;
//           display: flex;
//           flex-direction: column;
//           align-items: center;
//           gap: 0;
//         }
//         .avatar-label { cursor: pointer; margin-bottom: 20px; }
//         .avatar-ring {
//           width: 96px; height: 96px;
//           border-radius: 50%;
//           background: rgba(67,55,230,0.15);
//           border: 2px dashed rgba(67,55,230,0.4);
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           overflow: hidden;
//           transition: border-color 0.2s;
//           position: relative;
//         }
//         .avatar-ring:hover { border-color: rgba(67,55,230,0.8); }
//         .avatar-ring img {
//           width: 100%; height: 100%;
//           object-fit: cover;
//           border-radius: 50%;
//         }
//         .avatar-overlay {
//           position: absolute;
//           inset: 0;
//           background: rgba(0,0,0,0.4);
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           opacity: 0;
//           transition: opacity 0.2s;
//           border-radius: 50%;
//         }
//         .avatar-ring:hover .avatar-overlay { opacity: 1; }
//         .avatar-overlay-text {
//           color: #fff;
//           font-size: 11px;
//           font-weight: 600;
//           letter-spacing: 0.06em;
//           text-transform: uppercase;
//         }

//         /* Footer card */
//         .footer-card {
//           background: rgba(255,255,255,0.03);
//           border: 1px solid rgba(255,255,255,0.07);
//           border-radius: 14px;
//           padding: 18px 24px;
//           text-align: center;
//           color: rgba(255,255,255,0.35);
//           font-size: 14px;
//         }
//         .footer-card .link {
//           color: #7c6ff7;
//           cursor: pointer;
//           font-weight: 600;
//           transition: color 0.18s;
//         }
//         .footer-card .link:hover { color: #a89ff9; }

//         /* Error modal */
//         .modal-backdrop {
//           position: fixed;
//           inset: 0;
//           z-index: 200;
//           background: rgba(0,0,0,0.65);
//           backdrop-filter: blur(6px);
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           padding: 16px;
//           animation: fadeIn 0.18s ease both;
//         }
//         @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
//         .modal-box {
//           background: #16161e;
//           border: 1px solid rgba(255,255,255,0.09);
//           border-radius: 20px;
//           padding: 36px 32px 28px;
//           width: 100%;
//           max-width: 380px;
//           text-align: center;
//           animation: scaleIn 0.2s ease both;
//         }
//         @keyframes scaleIn { from { transform: scale(0.94); opacity: 0; } to { transform: scale(1); opacity: 1; } }
//         .modal-icon {
//           width: 48px; height: 48px;
//           background: rgba(239,68,68,0.12);
//           border: 1px solid rgba(239,68,68,0.25);
//           border-radius: 50%;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           margin: 0 auto 16px;
//           font-size: 20px;
//         }
//         .modal-title {
//           color: #ef4444;
//           font-size: 16px;
//           font-weight: 700;
//           margin-bottom: 10px;
//           font-family: 'Playfair Display', serif;
//         }
//         .modal-msg {
//           color: rgba(255,255,255,0.55);
//           font-size: 14px;
//           line-height: 1.6;
//           margin-bottom: 24px;
//         }
//         .modal-btn {
//           width: 100%;
//           height: 46px;
//           background: linear-gradient(135deg, #4337e6, #6d28d9);
//           border: none;
//           border-radius: 11px;
//           color: #fff;
//           font-size: 14.5px;
//           font-weight: 600;
//           font-family: 'DM Sans', sans-serif;
//           cursor: pointer;
//           transition: opacity 0.2s;
//         }
//         .modal-btn:hover { opacity: 0.88; }

//         /* Responsive tweaks */
//         @media (max-width: 480px) {
//           .main-card { padding: 28px 18px 24px; }
//           .brand-logo { width: 150px; }
//         }
//       `}</style>

//     <div className="signup-root">
//       {/* Background decoration */}
//       <div className="bg-blob bg-blob-1" />
//       <div className="bg-blob bg-blob-2" />
//       <div className="bg-blob bg-blob-3" />
//       <div className="grain-overlay" />

//       {loading ? (
//         <div className="loading-screen">
//           <div className="loader-ring" />
//           <p className="loading-text">Loading</p>
//         </div>
//       ) : (
//         <div className="page-wrapper">
//           <div className="content-column">
//             {/* Main card */}
//             <div className="main-card">
//               <img src="/LetterBee.png" alt="LetterBee" className="brand-logo" />
//               <p className="brand-tagline">
//                 Sign up to see photos and videos from your friends.
//               </p>
//               <div className="fields-wrapper">
//                 {otpSent && (
//                   <>
//                     {/* Google login */}
//                     {/* <button className="btn-google" onClick={login}>
//                         <img src="/googleIcon.jpg" alt="Google" className="google-icon" />
//                         Continue with Google
//                       </button> */}

//                     {/* OR divider */}
//                     <div className="divider" style={{ width: '100%', maxWidth: '340px' }}>
//                       <div className="divider-line" />
//                       <span className="divider-text">or</span>
//                       <div className="divider-line" />
//                     </div>

//                     {/* Email field */}
//                     <div className="field-wrap">
//                       <input
//                         type="email"
//                         placeholder="Enter your email"
//                         value={email}
//                         onChange={(e) => setEmail(e.target.value)}
//                         className="field-input"
//                       />
//                     </div>

//                     <button onClick={() => {
//                       if (!email) {
//                         errorHandler({ error: "Email is required" });
//                       } else {
//                         sendOtp();
//                       }
//                     }} className="btn-primary" style={{ marginBottom: '4px' }}>
//                       Send OTP
//                     </button>
//                   </>
//                 )}
//                 {otpVerified && (
//                   <>
//                     <div className="field-wrap">
//                       <input
//                         type="number"
//                         value={otp}
//                         onChange={(e) => setOtp(e.target.value)}
//                         placeholder="Enter your OTP"
//                         className="field-input"
//                         style={{ fontSize: '20px', letterSpacing: '0.25em' }}
//                       />
//                     </div>
//                     <button onClick={verify} className="btn-primary" style={{ marginBottom: '4px' }}>
//                       Verify OTP
//                     </button>
//                   </>
//                 )}
//                 {createAccount && (
//                   <>
//                     {["Full Name", "Username", "Password"].map((label, i) => (
//                       <div className="field-wrap" key={i}>
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
//                           onChange={(e) => {
//                             const value = e.target.value;
//                             if (label === "Full Name") {
//                               setFullName(value);
//                             } else if (label === "Username") {
//                               setUsername(value);
//                             } else {
//                               setPassword(value);
//                             }
//                           }}
//                           className="field-input"
//                         />
//                       </div>
//                     ))}
//                     <button
//                       onClick={() => {
//                         // validation on button click
//                         if (!passwordRegex.test(password)) {
//                           setPassword("");
//                           errorHandler({ error: "Password must be 8+ chars, include uppercase, lowercase, number, special char" });
//                           return;
//                         }
//                         chooseAvatar();
//                       }}
//                       className="btn-primary"
//                       style={{ marginBottom: "4px" }}
//                     >
//                       Continue
//                     </button>
//                   </>
//                 )}
//                 {profilepic && (
//                   <div className="avatar-section">
//                     <label className="avatar-label">
//                       <div className="avatar-ring">
//                         {avatar ? (
//                           <img src={URL.createObjectURL(avatar)} alt="avatar" />
//                         ) : (
//                           <img src="/profileIcon.png" alt="avatar placeholder" />
//                         )}
//                         <div className="avatar-overlay">
//                           <span className="avatar-overlay-text">Change</span>
//                         </div>
//                       </div>
//                       <input
//                         type="file"
//                         accept="image/*"
//                         onChange={(e) => setAvatar(e.target.files[0])}
//                         style={{ display: 'none' }}
//                       />
//                     </label>

//                     <div className="field-wrap">
//                       <input
//                         value={about}
//                         onChange={(e) => setAbout(e.target.value)}
//                         placeholder="Write something about yourself..."
//                         className="field-input"
//                       />
//                     </div>

//                     <button onClick={handleRegister} className="btn-primary" style={{ marginBottom: '4px' }}>
//                       Create Account
//                     </button>
//                   </div>
//                 )}
//               </div>
//             </div>
//             {/* Footer */}
//             <div className="footer-card">
//               Already have an account?{' '}
//               <span className="link" onClick={signIn}>Log in</span>
//             </div>
//           </div>
//         </div>
//       )}
//       {/* Error Modal */}
//       {errorMessage && (
//         <div className="modal-backdrop">
//           <div className="modal-box">
//             <div className="modal-icon">⚠️</div>
//             <h2 className="modal-title">Something went wrong</h2>
//             <p className="modal-msg">{errorMessage}</p>
//             <button className="modal-btn" onClick={onClose}>Got it</button>
//           </div>
//         </div>
//       )}
//     </div>
//   </>
// );