import { useState } from "react";
import { loginUser } from "../services/userService.jsx";
import { useNavigate } from "react-router-dom";
import {
  setUserId,
  setUserName,
  setUserAvatar,
  setUserAbout,
} from "../features/userSlice";
import { useDispatch } from "react-redux";
import axios from "axios";
import { BACKEND_API } from "../Backend_API.js";

const Sign_in = () => {
  const [signIn, setSignIn] = useState(true);
  const [userName, setuserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [changePassword, setChangePassword] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [verifyOtp, setVerifyOtp] = useState("");
  const [otp, setOtp] = useState("");
  const [createPassword, setCreatePassword] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const loadingFunc = () => {
    setLoading(true);
  };

  const handleLogin = async (e) => {
    loadingFunc();
    e.preventDefault();
    const credentials = { userName, email, password };
    try {
      const user = await loginUser(credentials);
      dispatch(setUserId({ userId: user.data.loggedInUser._id }));
      dispatch(setUserName({ userName: user.data.loggedInUser.fullName }));
      dispatch(setUserAvatar({ userAvatar: user.data.loggedInUser.avatar }));
      dispatch(setUserAbout({ userAbout: user.data.loggedInUser.about }));
      navigate("/layout");
    } catch (error) {
      console.error("Login failed:", error);
    }
    setLoading(false);
  };

  const forgetPassword = () => {
    setSignIn(false);
    setChangePassword(true);
  };

  const sendOTP = async () => {
    const response = await axios.post(`${BACKEND_API}/api/v1/users/otp`, {
      email,
    });
    setChangePassword(false);
    setOtpVerified(true);
    setVerifyOtp(response.data.data.otp);
  };

  const verify = () => {
    if (otp === verifyOtp) {
      setOtpVerified(false);
      setCreatePassword(true);
    } else {
      console.log("Wrong OTP");
    }
  };

  const passwordMaking = async () => {
    loadingFunc();
    try {
      const response = await axios.post(
        `${BACKEND_API}/api/v1/users/passwordChange`,
        { password, email }
      );
      console.log(response);
      const data = response.data.data;
      dispatch(setUserId({ userId: data._id }));
      dispatch(setUserName({ userName: data.fullName }));
      dispatch(setUserAvatar({ userAvatar: data.avatar }));
      dispatch(setUserAbout({ userAbout: data.about }));
      navigate("/layout");
    } catch (error) {
      console.log("Error:", error);
    }
    setLoading(false);
  };

  return (
    <div>
      {loading ? (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="w-12 h-12 border-4 border-[#4337e6] border-dashed rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">loading...</p>
        </div>
      ) : (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
          <div className="w-full max-w-xl sm:max-w-sm md:max-w-md p-8 rounded-xl flex flex-col items-center space-y-4">
            <img src="/LetterBee.png" alt="Logo" />

            {signIn ? (
              <div className="space-y-4 w-full flex flex-col items-center">
                <div className="relative group w-full">
                  <input
                    type="text"
                    placeholder="Username or email"
                    value={userName || email}
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
                    className="w-full text-lg sm:text-base px-2 py-1 outline-none"
                  />
                  <div className="absolute left-0 bottom-0 w-full h-[0.1rem] bg-[#4337e6] group-hover:h-[0.25rem] transition-all rounded-xl"></div>
                </div>

                <div className="relative group w-full">
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full text-lg sm:text-base px-2 py-1 outline-none"
                  />
                  <div className="absolute left-0 bottom-0 w-full h-[0.1rem] bg-[#4337e6] group-hover:h-[0.25rem] transition-all rounded-xl"></div>
                </div>

                <button
                  onClick={handleLogin}
                  className="relative w-full max-w-xs sm:max-w-full text-black font-bold py-2 px-4 rounded transition duration-300 font-mono hover:shadow-lg hover:shadow-sky-400 border border-gray-300">
                  Sign in
                </button>

                <div className="cursor-pointer" onClick={forgetPassword}>
                  Forgot password?
                </div>
              </div>
            ) : (
              <div className="w-full">
                {otpVerified && (
                  <div className="w-full flex flex-col items-center">
                    <div className="relative group w-full mb-4">
                      <input
                        type="number"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter your OTP"
                        className="w-full text-lg sm:text-base px-2 py-1 outline-none rounded-xl"
                      />
                      <div className="absolute left-0 bottom-0 w-full h-[0.1rem] bg-[#4337e6] group-hover:h-[0.25rem] transition-all rounded-xl"></div>
                    </div>

                    <button
                      onClick={verify}
                      className="w-full max-w-xs sm:max-w-full h-10 text-lg rounded-xl border border-slate-400 mb-4">
                      Verify your OTP
                    </button>
                  </div>
                )}

                {createPassword && (
                  <div className="w-full">
                    <div className="relative group w-full mb-4">
                      <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none bg-slate-100"
                      />
                    </div>
                    <button
                      onClick={passwordMaking}
                      className="w-full max-w-xs sm:max-w-full h-10 text-lg rounded-xl border border-gray-300 mb-4 font-bold">
                      Set Password
                    </button>
                  </div>
                )}

                {changePassword && (
                  <div className="w-full">
                    <div className="relative group w-full mb-4">
                      <input
                        type="text"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full p-3 outline-none appearance-none rounded-md border border-gray-300"
                      />
                    </div>
                    <button
                      onClick={sendOTP}
                      className="w-full max-w-xs sm:max-w-full h-10 text-lg rounded-xl border border-gray-300 mb-4 font-bold">
                      Send OTP
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="max-w-xs sm:max-w-full w-full p-4 rounded-xl flex items-center justify-center border border-gray-300 text-gray-700 text-center">
            Don't have an account?
            <div
              className="inline-block text-blue-500 hover:text-blue-600 relative after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-0 after:h-[2px] after:bg-blue-500 hover:after:w-full after:transition-all after:duration-300 cursor-pointer ml-1"
              onClick={() => navigate("/")}>
              Sign up
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sign_in;
