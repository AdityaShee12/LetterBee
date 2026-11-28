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
