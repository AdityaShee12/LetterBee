import { useState } from "react";
import { FaRegCirclePlay, FaCirclePlay } from "react-icons/fa6";
import { AiOutlineMessage, AiFillMessage } from "react-icons/ai";
import { AiOutlineNotification, AiFillNotification } from "react-icons/ai";
import { FaCamera, FaPen } from "react-icons/fa";
import { useNavigate, Outlet, useNavigationType } from "react-router-dom";
import Search from "../services/searchServices.jsx";
import { useEffect, useRef } from "react";
import axios from "axios";
import StatusUpload from "../services/statusUpload.jsx";
import { setUserAvatar, setUserAbout, clearUser } from "../features/userSlice";
import { useDispatch, useSelector } from "react-redux";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { BACKEND_API } from "../Backend_API.js";
import { clearChatAction, clearStatusAction } from "../features/layoutSlice.js";
import socket from "../socket.js";

const Layout = () => {
  const [email, setEmail] = useState();
  const [searchbarWidth, setSearchbarWidth] = useState(20); // Sidebar width in percentage
  const [showFullImage, setShowFullImage] = useState(false);
  const contextRef = useRef(null);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [originalY, setOriginalY] = useState(null);
  const [fullName, setFullName] = useState("");
  const [dragStyle, setDragStyle] = useState("");
  const [barStyle, setBarStyle] = useState("");
  const windowWidth = window.innerWidth;
  const [contextMenu, setContextMenu] = useState({
    show: false,
    x: 0,
    y: 0,
  });
  const { userId, userName, userAvatar, userAbout } = useSelector(
    (state) => state.user
  );
  const { chatAction, statusAction } = useSelector((state) => state.layout);
  const [menuAnimation, setMenuAnimation] = useState(false);
  const [statusClick, setStatusClick] = useState(false);
  const dispatch = useDispatch();
  const [editedAbout, setEditedAbout] = useState(userAbout);
  const [isZoomed, setIsZoomed] = useState(false);
  const [state, setState] = useState("message");
  const [list, setList] = useState(false);
  const navigationType = useNavigationType(); // PUSH | POP | REPLACE
  const [loading, setLoading] = useState(false);

  const loadingFunc = () => {
    setLoading(true);
  };

  useEffect(() => {
    if (navigationType === "POP") {
      if (chatAction === "chatPage") {
        dispatch(clearChatAction());
      }
      if (statusAction === "statusPage") {
        dispatch(clearStatusAction());
      }
      setList(false);
    }
    console.log("Chat", chatAction);
  }, [navigationType]);

  useEffect(() => {
    if (chatAction === "chatPage") {
      setList(true);
    }
    console.log("Chat", chatAction);
  }, [chatAction]);

  useEffect(() => {
    if (statusAction === "statusPage") {
      setList(true);
    }
    console.log("Chat", chatAction);
  }, [chatAction]);

  // useeffect for contextMenu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextRef.current && !contextRef.current.contains(event.target)) {
        closeContextMenu();
      }
    };

    if (contextMenu.show) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [contextMenu.show]);

  // Mouse Drag to Resize Sidebar
  const handleMouseDown = (e) => {
    e.preventDefault();
    setDragStyle("cursor-ew-resize");
    setBarStyle("w-[0.5rem]");
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e) => {
    e.preventDefault();
    const newWidth = (e.clientX / window.innerWidth) * 100;
    if (newWidth >= 20 && newWidth <= 48) {
      setSearchbarWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setDragStyle("");
    setBarStyle("");
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // open context menu
  const openContextMenu = (event) => {
    const rect = event.target.getBoundingClientRect();
    let positionX = rect.left - 20;
    let positionY = rect.top;
    const menuHeight = 265; // Approximate height of context menu
    const menuWidth = 268; // Approximate width of context menu
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    // Adjust vertically if overflowing bottom
    if (rect.top + menuHeight > viewportHeight) {
      positionY = rect.top - menuHeight;
    }
    // Adjust horizontally if overflowing right
    if (rect.left + menuWidth > viewportWidth) {
      positionX = rect.right - menuWidth;
    }
    setOriginalY(positionY);
    setContextMenu({
      show: true,
      x: positionX,
      y: positionY,
    });
    setMenuAnimation(false);
    setTimeout(() => setMenuAnimation(true), 300);
  };

  // close context menu
  const closeContextMenu = () => {
    setContextMenu({
      show: false,
      x: 0,
      y: 0,
    });
  };

  // Update proiflepic section
  const handleProfilePicChange = async (e) => {
    const file = e.target.files?.[0] || null;
    const formData = new FormData();
    formData.append("userId", userId);
    if (file) formData.append("avatar", file);

    try {
      const response = await axios.post(
        `${BACKEND_API}/api/v1/users/profilePicChange`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      const updated = response.data.data;
      dispatch(setUserAvatar({ userAvatar: updated.avatar }));
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  // Update about section
  const handleProfileAboutChange = async (editedText) => {
    try {
      const response = await axios.post(
        `${BACKEND_API}/api/v1/users/profileAboutChange`,
        {
          userId,
          about: editedText,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      const updated = response.data.data;
      dispatch(setUserAbout({ userAbout: updated.about }));
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  // Logout
  const handleLogout = async () => {
    loadingFunc();
    const response = await axios.post(
      `${BACKEND_API}/api/v1/users/logout`,
      { userId },
      {
        withCredentials: true,
      }
    );
    if (response) {
      socket.disconnect();
      navigate("/sign_in");
      dispatch(clearUser());
    }
  };

  const stateChange = (params) => {
    setState(params);
  };

  // Status upload system
  const statusUpload = () => {
    setStatusClick(true);
    stateChange("status");
  };

  const chat = () => {
    setStatusClick(false);
    stateChange("message");
  };

  return (
    <div>
      {loading ? (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="w-12 h-12 border-4 border-[#4337e6] border-dashed rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">loading...</p>
        </div>
      ) : (
        <div className={`flex flex-col h-screen overflow-hidden ${dragStyle}`}>
          <div className="flex-1 relative">
            {/* ===================== DESKTOP (unchanged) ===================== */}
            <div className="hidden lg:flex h-full">
              {/* Logo */}
              <img
                src="/LB.png"
                alt=""
                className="absolute w-[3rem] h-[2rem] mt-[1.5rem] ml-[1.5rem]"
              />

              {/* Left Icons Column */}
              <div className="flex flex-col my-[12rem] gap-[2rem] ml-[1.5rem]">
                {/* message */}
                <button
                  className="pl-[0.3rem] rounded-full hover:bg-gray-200"
                  onClick={() => chat()}>
                  {state === "message" ? (
                    <AiFillMessage size={33} className="text-[#4337e6]"/>
                  ) : (
                    <AiOutlineMessage
                      size={33}
                      onClick={() => stateChange("message")}
                    />
                  )}
                </button>

                {/* status */}
                <button
                  className="pl-[0.3rem] rounded-full hover:bg-gray-200"
                  onClick={statusUpload}>
                  {state === "status" ? (
                    <FaCirclePlay size={33} className="text-[#4337e6]"/>
                  ) : (
                    <FaRegCirclePlay
                      size={33}
                      onClick={() => stateChange("status")}
                    />
                  )}
                </button>

                {/* notification */}
                <button className="pl-[0.3rem] rounded-full">
                  {state === "notification" ? (
                    <AiFillNotification size={33} className="text-[#4337e6]"/>
                  ) : (
                    <AiOutlineNotification
                      size={33}
                      onClick={() =>
                        alert(
                          "The notification feature will be available within one week"
                        )
                      }
                    />
                  )}
                </button>

                {/* avatar */}
                <div
                  className="pl-[0.3rem]"
                  onClick={(e) => openContextMenu(e)}>
                  <img
                    src={userAvatar}
                    alt=""
                    className="w-[2rem] h-[2rem] rounded-full object-cover"
                  />
                </div>
              </div>

              {/* Search / Status */}

              <div
                style={{ width: `${searchbarWidth - 3.5}%` }}
                className="ml-[2.5rem] mt-[1rem]">
                {statusClick ? <StatusUpload /> : <Search />}
              </div>

              {/* Drag bar */}
              <div
                className={`w-[0.1rem] bg-[#4337e6] cursor-ew-resize hover:w-[0.5rem] ${barStyle}`}
                onMouseDown={handleMouseDown}
              />

              {/* Outlet */}
              <div className="flex-1">
                <Outlet />
              </div>
            </div>

            {/* ===================== MOBILE ===================== */}
            <div className="lg:hidden flex flex-col h-full">
              {/* Top bar */}
              <div className={`${list ? "hidden" : "visible"} `}>
                {" "}
                <img
                  src="/LB.png"
                  alt=""
                  className="absolute w-[3rem] h-[2rem] mt-[1.5rem] ml-[1.5rem]"
                />
              </div>

              {/* Search / Status full width */}
              <div className={`${list ? "hidden" : "visible"} p-2`}>
                {statusClick ? <StatusUpload /> : <Search />}
              </div>

              {/* Outlet middle */}
              <div className="flex-1 overflow-auto">
                <Outlet />
              </div>

              {/* Bottom icon row (RIGHT aligned) */}
              <div
                className={`${
                  list ? "hidden" : "visible"
                } h-[4rem] flex justify-between items-center gap-6 px-[1.4rem] border-t border-[#4337e6] relative`}>
                <button
                  className="pl-[0.3rem] rounded-full hover:bg-gray-200"
                  onClick={() => chat()}>
                  {state === "message" ? (
                    <AiFillMessage size={33} className="text-[#4337e6]"/>
                  ) : (
                    <AiOutlineMessage
                      size={33}
                      onClick={() => stateChange("message")}
                    />
                  )}
                </button>

                {/* status */}
                <button
                  className="pl-[0.3rem] rounded-full hover:bg-gray-200"
                  onClick={statusUpload}>
                  {state === "status" ? (
                    <FaCirclePlay size={33} className="text-[#4337e6]"/>
                  ) : (
                    <FaRegCirclePlay
                      size={33}
                      onClick={() => stateChange("status")}
                    />
                  )}
                </button>

                {/* notification */}
                <button className="pl-[0.3rem] rounded-full">
                  {state === "notification" ? (
                    <AiFillNotification size={33} className="text-[#4337e6]"/>
                  ) : (
                    <AiOutlineNotification
                      size={33}
                      onClick={() =>
                        alert(
                          "The notification feature will be available within one week"
                        )
                      }
                    />
                  )}
                </button>

                {/* avatar */}
                <div
                  className="pl-[0.3rem]"
                  onClick={(e) => openContextMenu(e)}>
                  <img
                    src={userAvatar}
                    alt=""
                    className="w-[2rem] h-[2rem] rounded-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* ===================== CONTEXT MENU ===================== */}
            {contextMenu.show && (
              <div
                ref={contextRef}
                className={`absolute rounded-xl w-72 h-72 p-4 z-50 shadow-2xl border bg-slate-400 translate-x-4 transition-all duration-300 ease-linear ${
                  menuAnimation
                    ? "opacity-100 translate-x-15"
                    : "opacity-0 -translate-x-1"
                }`}
                style={{
                  top: contextMenu.y,
                  left: contextMenu.x,
                }}
                onClick={(e) => e.stopPropagation()}>
                {/* Profile section */}
                <div className="flex flex-col items-start relative w-full">
                  <div className="relative">
                    <div className="relative w-24 h-24">
                      {isZoomed ? (
                        <TransformWrapper
                          initialScale={1}
                          wheel={{ step: 0.1 }}
                          pinch={{ step: 5 }}
                          doubleClick={{ disabled: true }}>
                          <TransformComponent>
                            <img
                              src={userAvatar}
                              alt="Profile"
                              className="w-[48vw] h-[95vh]"
                              onClick={() => setShowFullImage(true)}
                            />
                          </TransformComponent>
                        </TransformWrapper>
                      ) : (
                        <img
                          src={userAvatar}
                          alt="Profile"
                          onClick={() => setIsZoomed(true)}
                          className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                      )}
                      <label className="absolute -bottom-1 -right-1 bg-white border border-gray-300 p-1 rounded-full shadow cursor-pointer">
                        <FaCamera className="text-blue-600 text-xs" />
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleProfilePicChange}
                        />
                      </label>
                    </div>
                    <p className="mt-3 font-medium text-sm">{userName}</p>
                  </div>

                  <div className="w-full mt-3 relative">
                    {isEditing ? (
                      <>
                        <textarea
                          value={editedAbout}
                          onChange={(e) => setEditedAbout(e.target.value)}
                          className="w-full p-2 border border-blue-300 rounded text-sm resize-none bg-white text-gray-800"
                          rows={2}
                        />
                        <button
                          onClick={() => {
                            handleProfileAboutChange(editedAbout);
                            setIsEditing(false);
                          }}
                          className="mt-2 bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700 transition">
                          Save
                        </button>
                      </>
                    ) : (
                      <div className="flex justify-between items-center w-full">
                        <p className="text-sm text-gray-800">
                          {userAbout || "No about info"}
                        </p>
                        <FaPen
                          className="text-blue-500 text-xs cursor-pointer ml-2"
                          onClick={() => {
                            setEditedAbout(userAbout);
                            setIsEditing(true);
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mt-2">{email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="mt-4 w-full text-center bg-red-100 hover:bg-red-200 text-red-600 py-1 rounded-md transition">
                  Log out
                </button>
              </div>
            )}
            {showFullImage && (
              <div
                className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999]"
                onClick={() => setShowFullImage(false)}>
                <img
                  src={userAvatar}
                  alt="Full Profile"
                  className="max-w-full max-h-full object-contain rounded-none"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
