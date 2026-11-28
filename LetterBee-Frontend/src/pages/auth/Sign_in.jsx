import { useState } from "react";
import { loginUser } from "../../services/auth.service.jsx";
import { authAPI } from "../../api/api.js";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { resetPassword } from "../../services/auth.service.jsx";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useEffect } from "react";
import { userAPI } from "../../api/api.js";

const Sign_in = () => {
  const [signIn, setSignIn] = useState(true);
  const [userName, setuserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [changePassword, setChangePassword] = useState(false);
  const [id, setId] = useState(null);
  const [otpVerified, setOtpVerified] = useState(false);
  const [verifyOtp, setVerifyOtp] = useState("");
  const [otp, setOtp] = useState("");
  const [createPassword, setCreatePassword] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadingFunc = () => {
    setLoading(true);
  };

  const handleLogin = async (e) => {

    loadingFunc();
    e.preventDefault();

    if ((!userName && !email) || !password) {
      setLoading(true);
      errorHandler({ error: "Username or email is required" });
    }

    const loginData = {
      password,
    };

    if (email) {
      loginData.email = email;
    }
    if (userName) {
      loginData.userName = userName;
    }

    try {
      await loginUser(
        loginData,
        dispatch
      );
      navigate("/layout");
    } catch (error) {
      console.log("EM", error?.message);
      setLoading(false);
      if (error?.message === "Account does not exist") {
        errorHandler({ error: "Account does not exist" });
      } else if (error?.message === "Given password is wrong") {
        errorHandler({ error: "Given password is wrong" });
      }
    }
  };

  const errorHandler = ({ error }) => {
    setLoading(false);
    if (error === "Username or email is required") {
      setErrorMessage("Username or email is required");
    }
    else if (error === "Account does not exist") {
      setErrorMessage("Account does not exist");
    }
    else if (error === "Given password is wrong") {
      setErrorMessage("Given password is wrong");
    }
    else if (error === "Otp is required") {
      setErrorMessage(error);
    }
    else if (error === "An error occurred while sending OTP to the email") {
      setErrorMessage(error);
    }
    else if (error === "Given otp is not correct") {
      setErrorMessage("Given otp is not correct");
    }
  }

  const forgetPassword = () => {
    setSignIn(false);
    setChangePassword(true);
  };

  const passwordMaking = async () => {
    loadingFunc();
    
    try {
      const response = await resetPassword({ password, email }, dispatch);
      navigate("/layout");
    } catch (error) {
      console.log("Error:", error);
    }
    setLoading(false);
  };

  const onClose = () => {
    setErrorMessage(false);
  }

  const sendOTP = async () => {
    try {
      loadingFunc();
      const response = await authAPI.sendOTPforPassword({ email });
      if (response?.data.id) {
        setChangePassword(false);
        setId(response.data.id);
        setOtpVerified(true);
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

    if (otp) {
      loadingFunc();
      try {
        await authAPI.verifyOTPforPassword({ id, otp });
        setOtpVerified(false);
        setLoading(false);
        setCreatePassword(true);
      } catch (error) {
        errorHandler({ error: "Given otp is incorrect" });
      }
    }
    else {
      errorHandler({ error: "Otp is required" });
    }
  };



  return (
    <>
      <div className="font-sans min-h-screen bg-[#f0f1f8] relative overflow-hidden">
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

                <img src="/LetterBee.png" alt="LetterBee" className="w-44 mb-7 opacity-90" />

                {signIn ? (
                  /* Sign In form */
                  <div className="w-full">

                    {/* Username / email */}
                    <div className="w-full mb-5">
                      <input
                        type="text"
                        placeholder="Username or email"
                        value={email || userName}
                        onChange={(e) => {
                          const value = e.target.value;
                          const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                          if (isEmail) {
                            setEmail(value);
                            setuserName("");
                          } else {
                            setuserName(value);
                            setEmail("");
                          }
                        }}
                        required
                        className="w-full bg-[#f4f5fb] border-[1.5px] border-[#d6d8ef] rounded-xl px-4 py-3 text-[#1a1a2e] text-[14.5px] outline-none focus:border-[#3D4DB7] focus:bg-[#eef0fb] placeholder:text-[#aaa] transition-all"
                      />
                    </div>

                    {/* Password */}
                    <div className="relative w-full mb-5">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full bg-[#f4f5fb] border-[1.5px] border-[#d6d8ef] rounded-xl px-4 py-3 pr-12 text-[#1a1a2e] text-[14.5px] outline-none focus:border-[#3D4DB7] focus:bg-[#eef0fb] placeholder:text-[#aaa] transition-all"
                      />
                      <button
                        className="absolute right-[14px] top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[#aaa] hover:text-[#3D4DB7] text-base flex items-center justify-center transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                        type="button"
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>

                    <button
                      onClick={handleLogin}
                      className="w-full h-[50px] bg-[#3D4DB7] hover:bg-[#3041a3] text-white rounded-xl text-[15px] font-semibold tracking-wide transition-all shadow-[0_4px_24px_rgba(61,77,183,0.25)] hover:shadow-[0_8px_32px_rgba(61,77,183,0.35)] hover:-translate-y-px active:translate-y-0"
                    >
                      Sign in
                    </button>

                    <p
                      onClick={forgetPassword}
                      className="mt-[14px] text-[#aaa] hover:text-[#3D4DB7] text-[13.5px] cursor-pointer text-center transition-colors"
                    >
                      Forgot password?
                    </p>
                  </div>
                ) : (
                  /* OTP / reset flow */
                  <div className="w-full">
                    {otpVerified && (
                      <>
                        <div className="w-full mb-5">
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
                          className="w-full h-[50px] bg-[#3D4DB7] hover:bg-[#3041a3] text-white rounded-xl text-[15px] font-semibold tracking-wide transition-all shadow-[0_4px_24px_rgba(61,77,183,0.25)] hover:shadow-[0_8px_32px_rgba(61,77,183,0.35)] hover:-translate-y-px active:translate-y-0 mb-4"
                        >
                          Verify OTP
                        </button>
                      </>
                    )}
                    {createPassword && (
                      <>
                        <div className="relative w-full mb-5">
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="New password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-[#f4f5fb] border-[1.5px] border-[#d6d8ef] rounded-xl px-4 py-3 pr-12 text-[#1a1a2e] text-[14.5px] outline-none focus:border-[#3D4DB7] focus:bg-[#eef0fb] placeholder:text-[#aaa] transition-all"
                          />
                          <button
                            className="absolute right-[14px] top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[#aaa] hover:text-[#3D4DB7] text-base flex items-center justify-center transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                            type="button"
                          >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                        <button
                          onClick={passwordMaking}
                          className="w-full h-[50px] bg-[#3D4DB7] hover:bg-[#3041a3] text-white rounded-xl text-[15px] font-semibold tracking-wide transition-all shadow-[0_4px_24px_rgba(61,77,183,0.25)] hover:shadow-[0_8px_32px_rgba(61,77,183,0.35)] hover:-translate-y-px active:translate-y-0 mb-4"
                        >
                          Set Password
                        </button>
                      </>
                    )}
                    {changePassword && (
                      <>
                        <div className="w-full mb-5">
                          <input
                            type="text"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-[#f4f5fb] border-[1.5px] border-[#d6d8ef] rounded-xl px-4 py-3 text-[#1a1a2e] text-[14.5px] outline-none focus:border-[#3D4DB7] focus:bg-[#eef0fb] placeholder:text-[#aaa] transition-all"
                          />
                        </div>
                        <button
                          onClick={sendOTP}
                          className="w-full h-[50px] bg-[#3D4DB7] hover:bg-[#3041a3] text-white rounded-xl text-[15px] font-semibold tracking-wide transition-all shadow-[0_4px_24px_rgba(61,77,183,0.25)] hover:shadow-[0_8px_32px_rgba(61,77,183,0.35)] hover:-translate-y-px active:translate-y-0 mb-4"
                        >
                          Send OTP
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              {/* Footer */}
              <div className="bg-white border border-[#d6d8ef] rounded-2xl px-6 py-4 text-center text-[#888] text-sm">
                Don't have an account?{' '}
                <span
                  onClick={() => navigate("/sign_up")}
                  className="text-[#3D4DB7] hover:text-[#3041a3] font-semibold cursor-pointer transition-colors"
                >
                  Sign up
                </span>
              </div>
            </div>
          </div>
        )}
        {/* Error Modal */}
        {errorMessage && (
          <div className="fixed inset-0 z-[200] bg-[#3D4DB7]/15 backdrop-blur-md flex items-center justify-center p-4">
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
}

export default Sign_in;