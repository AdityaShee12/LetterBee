import { useState } from "react";
import { FaRegCirclePlay, FaCirclePlay } from "react-icons/fa6";
import { AiOutlineMessage, AiFillMessage } from "react-icons/ai";
import { AiOutlineNotification, AiFillNotification } from "react-icons/ai";
import { MdGroup, MdOutlineGroup, MdMoreVert } from "react-icons/md";
import { FaCamera, FaPen } from "react-icons/fa";
import { useNavigate, Outlet, useNavigationType } from "react-router-dom";
import { useEffect, useRef } from "react";
import axios from "axios";
import Search from "../services/search.service.jsx";
import StatusUpload from "../services/status.service.jsx";
import GroupSearch from "../services/groupSearch.service.jsx";
import Notification from "../services/notification.service.jsx";
import { setUserAvatar, setUserAbout, clearUser } from "../features/userSlice";
import { useDispatch, useSelector } from "react-redux";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { BACKEND_API } from "../Backend_API.js";
import { clearChatAction, clearStatusAction } from "../features/layoutSlice.js";
import { refreshAccessToken, logoutUser } from "../services/user.service.jsx";
import socket from "../socket.js";

const Layout = () => {
  const [email, setEmail] = useState();
  const [searchbarWidth, setSearchbarWidth] = useState(20); // Sidebar width in percentage
  const [showFullImage, setShowFullImage] = useState(false);
  const contextRef = useRef(null);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [dragStyle, setDragStyle] = useState("");
  const [barStyle, setBarStyle] = useState("");
  const windowWidth = window.innerWidth;
  const [contextMenu, setContextMenu] = useState({
    show: false,
    x: 0,
    y: 0,
  });
  const [contextGroup, setContextGroup] = useState({
    show: false,
    x: 0,
    y: 0,
  });
  const { userId, userName, userAvatar, userAbout } = useSelector(
    (state) => state.user,
  );
  const { chatAction, statusAction } = useSelector((state) => state.layout);
  const [menuAnimation, setMenuAnimation] = useState(false);
  const [stateClick, setStateClick] = useState("message");
  const dispatch = useDispatch();
  const [editedAbout, setEditedAbout] = useState(userAbout);
  const [isZoomed, setIsZoomed] = useState(false);
  const [state, setState] = useState("message");
  const [list, setList] = useState(false);
  const navigationType = useNavigationType(); // PUSH | POP | REPLACE
  const [loading, setLoading] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);

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

  const cameraLoadingFunc = () => {
    setCameraLoading(true);
  };

  // Update proiflepic section
  const handleProfilePicChange = async (e) => {
    cameraLoadingFunc();
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
        },
      );
      setCameraLoading(false);
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
        },
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
    try {
      const response = await logoutUser();
      if (response) {
        socket.disconnect();
        navigate("/sign_in");
        dispatch(clearUser());
      }
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          await refreshAccessToken();   // try refresh
          // Retry logout
          await logoutUser();
          socket.disconnect();
          dispatch(clearUser());
          navigate("/sign_in");
        } catch (refreshError) {
          // Refresh failed → force logout
          dispatch(clearUser());
          navigate("/sign_in");
        }
      } else {
        console.log("Other error:", error);
      }
    }
  };

  // open context menu
  const openContextGroup = (event) => {
    const rect = event.target.getBoundingClientRect();
    let positionX = rect.left - 20;
    let positionY = rect.top;
    const menuHeight = 265; // Approximate height of context menu
    const menuWidth = 268; // Approximate width of context menu
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    // Adjust vertically if overflowing bottom
    if (rect.top + menuHeight > viewportHeight) {
      positionY = rect.top - menuHeight;
    }
    // Adjust horizontally if overflowing right
    if (rect.left + menuWidth > viewportWidth) {
      positionX = rect.right - menuWidth;
    }
    setContextGroup({
      show: true,
      x: positionX,
      y: positionY,
    });
    setMenuAnimation(false);
    setTimeout(() => setMenuAnimation(true), 300);
  };

  // close context menu
  const closeContextGroup = () => {
    setContextGroup({
      show: false,
      x: 0,
      y: 0,
    });
  };

  // useeffect for contextMenu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextRef.current && !contextRef.current.contains(event.target)) {
        closeContextGroup();
      }
    };

    if (contextGroup.show) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [contextGroup.show]);

  const stateChange = (params) => {
    setState(params);
  };

  // Status upload system
  const statusUpload = () => {
    setStateClick(true);
    stateChange("status");
  };

  const chat = () => {
    setStateClick("message");
    stateChange("message");
  };

  const group = () => {
    closeContextGroup();
    setStateClick("groupSearch");
  };

  return (
    <div className="lb-root">
      <div className="lb-blob lb-blob-1" />
      <div className="lb-blob lb-blob-2" />
      <div className="lb-blob lb-blob-3" />
      <div className="lb-grain" />

      {loading ? (
        <div className="relative z-50 h-screen w-screen flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#4337e6] border-dashed rounded-full animate-spin"></div>
          <p className="mt-4 text-white/50 tracking-widest uppercase text-sm font-medium">LOADING...</p>
        </div>
      ) : (
        <div className={`flex flex-col h-screen overflow-hidden relative z-10 ${dragStyle}`}>
          <div className="flex-1 relative">
            {/* ===================== DESKTOP (unchanged) ===================== */}

            <div className="hidden lg:flex h-full">
              {/* Logo */}
              <img
                src="/LetterBee.png"
                alt=""
                className="absolute w-[3rem] h-[2rem] mt-[1.5rem] ml-[1.5rem]"
              />

              {/* Left Icons Column */}
              <div className="flex flex-col my-[12rem] gap-[2rem] ml-[1.5rem]">
                {/* message */}
                <button
                  className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  onClick={() => chat()}>
                  {state === "message" ? (
                    <AiFillMessage size={28} className="text-[#a78bfa]" />
                  ) : (
                    <AiOutlineMessage
                      size={28}
                      onClick={() => stateChange("message")}
                    />
                  )}
                </button>

                {/* Group message */}
                <button
                  className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  onClick={() => group()}>
                  {state === "groupMessage" ? (
                    <MdGroup size={28} className="text-[#a78bfa]" />
                  ) : (
                    <MdOutlineGroup
                      size={28}
                      onClick={() => stateChange("groupMessage")}
                    />
                  )}
                </button>

                {/* status */}
                <button
                  className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  onClick={statusUpload}>
                  {state === "status" ? (
                    <FaCirclePlay size={28} className="text-[#a78bfa]" />
                  ) : (
                    <FaRegCirclePlay
                      size={28}
                      onClick={() => stateChange("status")}
                    />
                  )}
                </button>

                {/* notification */}
                <button className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                  {state === "notification" ? (
                    <AiFillNotification size={28} className="text-[#a78bfa]" />
                  ) : (
                    <AiOutlineNotification
                      size={28}
                      onClick={() => stateChange("notification")}
                    />
                  )}
                </button>

                {/* avatar */}
                <div
                  className="p-1 rounded-full border border-white/20 hover:border-white/50 transition-colors cursor-pointer w-[2.8rem] h-[2.8rem] flex items-center justify-center -ml-1"
                  onClick={(e) => openContextMenu(e)}>
                  <img
                    src={userAvatar}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>

              {/* Left side of layout */}
              <div
                style={{ width: `${searchbarWidth - 3.5}%` }}
                className="">
                {stateClick === "message" && (
                  <div className="ml-[2rem]">
                    <div className="flex justify-end mt-[1.7rem]">
                      <button
                        className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors mr-[0.5rem]"
                        onClick={(e) => openContextGroup(e)}>
                        <MdMoreVert size={27} />
                      </button>
                    </div>
                    <Search />
                  </div>
                )}
                {stateClick === "status" && (
                  <div>
                    <StatusUpload />
                  </div>
                )}
                {stateClick === "groupSearch" && (
                  <div>
                    <GroupSearch />
                  </div>
                )}
                {stateClick === "Notification" && (
                  <div>
                    <Notification />
                  </div>
                )}
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
                {stateClick ? <StatusUpload /> : <Search />}
              </div>

              {/* Outlet middle */}
              <div className="flex-1 overflow-auto">
                <Outlet />
              </div>

              {/* Bottom icon row (RIGHT aligned) */}
              <div
                className={`${list ? "hidden" : "visible"
                  } h-[4rem] flex justify-between items-center gap-6 px-[1.4rem] border-t border-white/10 bg-[#0d0d0f]/80 backdrop-blur-md relative`}>
                <button
                  className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  onClick={() => chat()}>
                  {state === "message" ? (
                    <AiFillMessage size={28} className="text-[#a78bfa]" />
                  ) : (
                    <AiOutlineMessage
                      size={28}
                      onClick={() => stateChange("message")}
                    />
                  )}
                </button>

                {/* status */}
                <button
                  className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  onClick={statusUpload}>
                  {state === "status" ? (
                    <FaCirclePlay size={28} className="text-[#a78bfa]" />
                  ) : (
                    <FaRegCirclePlay
                      size={28}
                      onClick={() => stateChange("status")}
                    />
                  )}
                </button>

                {/* notification */}
                <button className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                  {state === "notification" ? (
                    <AiFillNotification size={28} className="text-[#a78bfa]" />
                  ) : (
                    <AiOutlineNotification
                      size={28}
                      onClick={() =>
                        alert(
                          "The notification feature will be available within one week",
                        )
                      }
                    />
                  )}
                </button>

                {/* avatar */}
                <div
                  className="p-1 rounded-full border border-white/20 hover:border-white/50 transition-colors cursor-pointer w-[2.8rem] h-[2.8rem] flex items-center justify-center -ml-1"
                  onClick={(e) => openContextMenu(e)}>
                  <img
                    src={userAvatar}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
            </div>
            {/* ===================== CONTEXT MENU ===================== */}
            {contextMenu.show && (
              <div
                ref={contextRef}
                className={`absolute rounded-xl w-72 p-5 z-50 shadow-2xl border border-white/10 
                 backdrop-blur-xl bg-[#16161e]/90 text-white transition-all duration-300 ease-out
                 ${menuAnimation
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 translate-x-6 lg:-translate-x-6"
                  }`}
                style={{
                  top: contextMenu.y,
                  left: contextMenu.x,
                }}
                onClick={(e) => e.stopPropagation()}>
                {/* Profile section */}
                <div className="flex flex-col items-start relative w-full">
                  <div className="relative">
                    {cameraLoading ? (
                      <div className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg flex justify-center items-center">
                        {" "}
                        <div className="w-12 h-12 border-4 border-[#4337e6] border-dashed rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <div className="relative w-24 h-24">
                        {isZoomed ? (
                          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80">
                            <TransformWrapper
                              initialScale={1}
                              wheel={{ step: 0.1 }}
                              pinch={{ step: 5 }}
                              doubleClick={{ disabled: true }}>
                              <TransformComponent>
                                <img
                                  src={userAvatar}
                                  className="max-w-full max-h-full"
                                  onClick={() => setIsZoomed(false)}
                                />
                              </TransformComponent>
                            </TransformWrapper>
                          </div>
                        ) : (
                          <img
                            src={userAvatar}
                            alt="Profile"
                            onClick={() => setIsZoomed(true)}
                            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                          />
                        )}
                        <label className="absolute -bottom-1 -right-1 bg-white border border-gray-300 p-1 rounded-full shadow cursor-pointer mr-[0.7rem]">
                          <FaCamera className="text-blue-600 text-xs" />
                          <input
                            type="file"
                            className="hidden"
                            onChange={handleProfilePicChange}
                          />
                        </label>
                      </div>
                    )}
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

                  <p className="text-sm text-gray-400 mt-2">{email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="mt-6 w-full text-center bg-red-500/10 hover:bg-red-500/20 text-red-500 py-2 rounded-xl transition-colors font-medium tracking-wide">
                  Log out
                </button>
              </div>
            )}
            { }
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
            {contextGroup.show && (
              <div
                ref={contextRef}
                className={`absolute rounded-xl w-[13rem] p-4 z-50 shadow-2xl border border-white/10 
                 backdrop-blur-xl bg-[#16161e]/90 text-white transition-all duration-300 ease-out
                 ${menuAnimation
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-6"
                  }`}
                style={{
                  top: contextGroup.y,
                  left: contextGroup.x,
                }}
                onClick={(e) => e.stopPropagation()}>
                {/* Profile section */}
                <button onClick={group}>New Group</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;