import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/userService";
import {
  setUserId,
  setUserName,
  setUserAvatar,
  setUserAbout,
} from "../features/userSlice";
import { useDispatch } from "react-redux";
import { BACKEND_API } from "../Backend_API.js";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Sign_up = () => {
  const [profilepic, setProfilepic] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [verifyOtp, setVerifyOtp] = useState("");
  const [otpSent, setOtpSent] = useState(true);
  const [registeremail, setregisterEmail] = useState("");
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

  const login = () => {
    window.open(`${BACKEND_API}/api/v1/users/auth/google`, "_self");
  };

  const loadingFunc = () => {
    setLoading(true);
  };

  const sendOtp = async () => {
    loadingFunc();
    try {
      const response = await axios.post(`${BACKEND_API}/api/v1/users/otp`, {
        email,
      });
      setLoading(false);
      setVerifyOtp(response.data.data.otp);
      setregisterEmail(response.data.data.email);
      setOtpSent(false);
      setotpVerified(true);
    } catch (error) {
      setLoading(false);
      alert(error);
    }
  };

  const verify = () => {
    loadingFunc();
    if (otp === verifyOtp) {
      setotpVerified(false);
      setCreateAccount(true);
      setLoading(false);
    } else {
      alert("You gave wrong OTP");
    }
  };

  const signIn = () => navigate("/sign_in");

  const chooseAvatar = () => {
    const regex = /^[a-z0-9._]+$/;
    if (!regex.test(userName)) {
      alert(
        "Username must contain only lowercase letters, numbers, dot, underscore."
      );
    } else {
      setCreateAccount(false);
      setProfilepic(true);
    }
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
      alert(error);
      setLoading(false);
    }
  };

  return (
    <div>
      {loading ? (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="w-12 h-12 border-4 border-[#4337e6] border-dashed rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">loading...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center px-2">
          <div className="border border-slate-400 rounded-md bg-white mt-12 p-8 w-full max-w-[26rem] h-auto sm:h-[35rem] flex flex-col items-center">
            <img src="/LetterBee.png" alt="" className="w-[18rem]" />

            <div className="text-lg text-center font-serif text-slate-500 mb-4">
              Sign up to see photos and videos from your friends.
            </div>

            <div className="w-full flex flex-col items-center">
              {otpSent && (
                <>
                  <button className="bg-[#4337e6] text-white text-lg w-full max-w-[23rem] h-[2.8rem] rounded-xl my-6 flex items-center justify-center gap-3">
                    <img
                      src="/googleIcon.jpg"
                      alt=""
                      className="w-6 h-6"
                      onClick={login}
                    />
                    Login with Google
                  </button>

                  <div className="relative w-full max-w-[23rem]">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-2 py-1 text-lg outline-none"
                    />
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#4337e6]"></div>
                  </div>

                  <button
                    onClick={sendOtp}
                    className="bg-[#4337e6] text-white text-lg w-full max-w-[23rem] h-[2.8rem] rounded-xl my-6">
                    Send OTP
                  </button>
                </>
              )}

              {otpVerified && (
                <>
                  <div className="relative w-full max-w-[23rem]">
                    <input
                      type="number"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter your OTP"
                      className="w-full px-2 text-2xl outline-none my-[rem]"
                    />
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#4337e6]"></div>
                  </div>

                  <button
                    onClick={verify}
                    className="bg-[#4337e6] text-white text-lg w-full max-w-[23rem] h-[2.8rem] rounded-xl my-6">
                    Verify your OTP
                  </button>
                </>
              )}

              {createAccount && (
                <>
                  {["Full Name", "Username", "Password"].map((label, i) => (
                    <div key={i} className="relative w-full max-w-[23rem] mb-6">
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
                        onChange={(e) =>
                          label === "Full Name"
                            ? setFullName(e.target.value)
                            : label === "Username"
                            ? setUsername(e.target.value)
                            : setPassword(e.target.value)
                        }
                        className="w-full px-2 py-1 text-lg outline-none"
                      />
                      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#4337e6]"></div>
                    </div>
                  ))}

                  <button
                    onClick={chooseAvatar}
                    className="bg-[#4337e6] text-white text-lg w-full max-w-[23rem] h-[2.8rem] rounded-xl my-6">
                    Next
                  </button>
                </>
              )}
            </div>

            {profilepic && (
              <div className="w-full max-w-[26rem] flex flex-col items-center">
                <label className="cursor-pointer">
                  <div className="bg-slate-300 w-32 h-32 rounded-full flex justify-center items-center mb-4">
                    {avatar ? (
                      <img
                        src={URL.createObjectURL(avatar)}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <img
                        src="/profileIcon.png"
                        className="w-full h-full rounded-full object-cover"
                      />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatar(e.target.files[0])}
                    className="hidden"
                  />
                </label>

                <div className="relative w-full max-w-[23rem]">
                  <input
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    placeholder="Write something about yourself..."
                    className="w-full px-3 py-2 text-xl outline-none"
                  />
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#4337e6]"></div>
                </div>

                <button
                  onClick={handleRegister}
                  className="bg-[#4337e6] text-white text-lg rounded-xl w-full max-w-[23rem] h-[3rem] my-4">
                  Next
                </button>
              </div>
            )}
          </div>

          <p className="text-center text-gray-600 m-7 border border-slate-400 rounded-md p-4 w-full max-w-[26rem] text-lg">
            Already have an account?{" "}
            <span className="text-[#4337e6] cursor-pointer" onClick={signIn}>
              Login here
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default Sign_up;
