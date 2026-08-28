import { useState } from "react";
import { FaRegCirclePlay, FaCirclePlay } from "react-icons/fa6";
import { AiOutlineMessage, AiFillMessage } from "react-icons/ai";
import { AiOutlineNotification, AiFillNotification } from "react-icons/ai";
import { MdGroup, MdOutlineGroup, MdMoreVert } from "react-icons/md";
import { FaCamera, FaPen } from "react-icons/fa";
import { useNavigate, Outlet, useNavigationType } from "react-router-dom";
import { useEffect, useRef } from "react";
import axios from "axios";
import ChatSidebar from "../components/chat/ChatSidebar.jsx";
// import StatusUpload from "../services/status.service.jsx";
import GroupSearch from "../services/groupSearch.service.jsx";
import Notification from "../services/notification.service.jsx";
// import { setUserAvatar, setUserAbout, clearUser } from "../features/userSlice";
import { useDispatch, useSelector } from "react-redux";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { BACKEND_API } from "../api/Backend_API.js";
// import { clearChatAction, clearStatusAction } from "../features/layoutSlice.js";
// import { refreshAccessToken, logoutUser } from "../services/user.service.jsx";
import socket from "../sockets/socket.js";
import { logoutUser } from "../services/auth.service.jsx";
import { changeProfilePic, changeProfileAbout } from "../services/user.service.jsx";

const Layout = () => {
    const [userId, setUserId] = useState("");
    const [fullName, setFullName] = useState("");
    const [userName, setUserName] = useState("");
    const [email, setEmail] = useState();
    const [avatar, setAvatar] = useState("");
    const [about, setAbout] = useState("");
    const [editedAbout, setEditedAbout] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const { user } = useSelector(
        (state) => state.user,
    );

    const [searchbarWidth, setSearchbarWidth] = useState(20); // Sidebar width in percentage
    const [showFullImage, setShowFullImage] = useState(false);
    const contextRef = useRef(null);
    const navigate = useNavigate();

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

    const { chatAction, statusAction } = useSelector((state) => state.layout);
    const [menuAnimation, setMenuAnimation] = useState(false);
    const [stateClick, setStateClick] = useState("message");
    const dispatch = useDispatch();

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
        if (!user) return;
        const { _id, email, fullName, userName, avatar, about } = user;
        setUserId(_id);
        setAvatar(avatar);
        setFullName(fullName);
        setEmail(email);
        setUserName(userName);
        setAbout(about);
    }, [user]);

    useEffect(() => {
        // if (navigationType === "POP") {
        //   if (chatAction === "chatPage") {
        //     dispatch(clearChatAction());
        //   }
        //   if (statusAction === "statusPage") {
        //     dispatch(clearStatusAction());
        //   }
        //   setList(false);
        // }
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
            await changeProfilePic(formData, dispatch);
            setCameraLoading(false);
            // dispatch(setUserAvatar({ userAvatar: updated.avatar }));
        } catch (error) {
            console.error("Error updating profile:", error);
        }
    };

    // Update about section
    const handleProfileAboutChange = async (editedText) => {
        try {
            const aboutData = {
                userId,
                about: editedText,
            };
            await changeProfileAbout(aboutData, dispatch);
            setAbout(editedText);
        } catch (error) {
            console.error("Error updating profile:", error);
        }
    };

    // Logout
    const handleLogout = async () => {
        loadingFunc();
        try {
            const response = await logoutUser(dispatch);
            if (response) {
                socket.disconnect();
                navigate("/");
            }
        } catch (error) {
            if (error.response?.status === 401) {
                try {
                    await refreshAccessToken();   // try refresh
                    // Retry logout
                    await logoutUser(dispatch, userId);
                    socket.disconnect();
                    navigate("/");
                } catch (refreshError) {
                    console.log("Refresherr", refreshError);

                    // Refresh failed → force logout
                    dispatch(clearUser());
                    navigate("/");
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
        setStateClick("status");
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
        <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#f0f1f8' }}>
            {loading ? (
                <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#f0f1f8] z-[100]">
                    <div className="w-[52px] h-[52px] border-[3px] border-[#3D4DB7]/20 border-t-[#3D4DB7] rounded-full animate-spin" />
                    <p className="mt-[18px] text-[#3D4DB7]/50 text-[13px] tracking-[0.12em] uppercase font-medium">Loading</p>
                </div>
            ) : (
                <div className={`flex flex-col h-screen overflow-hidden relative z-10 ${dragStyle}`}>
                    <div className="flex-1 relative">

                        {/* ===================== DESKTOP ===================== */}
                        <div className="hidden lg:flex h-full">

                            {/* Left Icons Column — WhatsApp style full height */}
                            <div className="flex flex-col items-center h-full w-[68px] bg-white border-r border-[#d6d8ef] z-20 py-4 flex-shrink-0">

                                {/* Logo */}
                                <img
                                    src="/LB.png"
                                    alt=""
                                    className="w-[2.2rem] h-[2.2rem] object-contain mb-6"
                                />
                                {/* Icons — মাঝে flex-1 দিয়ে push */}
                                <div className="flex flex-col items-center gap-[0.5rem] flex-1">
                                    {/* message */}
                                    <button
                                        className="w-[44px] h-[44px] flex items-center justify-center rounded-xl transition-all duration-200"
                                        style={{
                                            color: state === "message" ? '#3D4DB7' : '#9090a8',
                                            background: state === "message" ? 'rgba(61,77,183,0.08)' : 'transparent',
                                        }}
                                        onClick={() => chat()}>
                                        {state === "message" ? (
                                            <AiFillMessage size={24} />
                                        ) : (
                                            <AiOutlineMessage size={24} onClick={() => stateChange("message")} />
                                        )}
                                    </button>
                                    {/* Group message */}
                                    <button
                                        className="w-[44px] h-[44px] flex items-center justify-center rounded-xl transition-all duration-200"
                                        style={{
                                            color: state === "groupMessage" ? '#3D4DB7' : '#9090a8',
                                            background: state === "groupMessage" ? 'rgba(61,77,183,0.08)' : 'transparent',
                                        }}
                                        onClick={() => group()}>
                                        {state === "groupMessage" ? (
                                            <MdGroup size={24} />
                                        ) : (
                                            <MdOutlineGroup size={24} onClick={() => stateChange("groupMessage")} />
                                        )}
                                    </button>
                                    {/* status */}
                                    <button
                                        className="w-[44px] h-[44px] flex items-center justify-center rounded-xl transition-all duration-200"
                                        style={{
                                            color: state === "status" ? '#3D4DB7' : '#9090a8',
                                            background: state === "status" ? 'rgba(61,77,183,0.08)' : 'transparent',
                                        }}
                                        onClick={statusUpload}>
                                        {state === "status" ? (
                                            <FaCirclePlay size={24} />
                                        ) : (
                                            <FaRegCirclePlay size={24} onClick={() => stateChange("status")} />
                                        )}
                                    </button>
                                    {/* notification */}
                                    <button
                                        className="w-[44px] h-[44px] flex items-center justify-center rounded-xl transition-all duration-200"
                                        style={{
                                            color: state === "notification" ? '#3D4DB7' : '#9090a8',
                                            background: state === "notification" ? 'rgba(61,77,183,0.08)' : 'transparent',
                                        }}>
                                        {state === "notification" ? (
                                            <AiFillNotification size={24} />
                                        ) : (
                                            <AiOutlineNotification size={24} onClick={() => stateChange("notification")} />
                                        )}
                                    </button>
                                </div>
                                {/* Avatar — একদম নিচে */}
                                <div
                                    className="w-[38px] h-[38px] rounded-full border-2 cursor-pointer flex-shrink-0 overflow-hidden"
                                    style={{ borderColor: '#d6d8ef' }}
                                    onClick={(e) => openContextMenu(e)}>
                                    <img src={avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                </div>
                            </div>

                            {/* Left sidebar panel */}
                            <div
                                style={{ width: `${searchbarWidth - 3.5}%` }}
                                className="h-full z-10 bg-white border-r border-[#d6d8ef]">
                                {stateClick === "message" && (
                                    <div className="ml-[1rem] h-full flex flex-col">
                                        <div className="flex justify-end mt-[1.7rem]">
                                            <button
                                                className="p-2 rounded-xl text-[#9090a8] hover:text-[#3D4DB7] hover:bg-[#eef0fb] transition-colors mr-[0.5rem]"
                                                onClick={(e) => openContextGroup(e)}>
                                                <MdMoreVert size={27} />
                                            </button>
                                        </div>
                                        <ChatSidebar />
                                    </div>
                                )}
                                {stateClick === "status" && <div></div>}
                                {stateClick === "groupSearch" && <div><GroupSearch /></div>}
                                {stateClick === "Notification" && <div><Notification /></div>}
                            </div>

                            {/* Drag bar */}
                            <div
                                className={`w-[1px] bg-[#d6d8ef] hover:w-[3px] hover:bg-[#3D4DB7]/40 cursor-ew-resize transition-all h-full z-20 ${barStyle}`}
                                onMouseDown={handleMouseDown}
                            />

                            {/* Right side Outlet */}
                            <div className="flex-1 h-full z-10 bg-[#f0f1f8]">
                                <Outlet />
                            </div>
                        </div>

                        {/* ===================== MOBILE ===================== */}
                        <div className="lg:hidden flex flex-col h-full z-10">
                            <div className="flex-1 overflow-auto">
                                <Outlet />
                            </div>

                            <div
                                className={`${list ? "hidden" : "flex"} h-[4rem] justify-between items-center gap-6 px-[1.4rem] border-t`}
                                style={{ backgroundColor: '#ffffff', borderColor: '#d6d8ef' }}>
                                {/* mobile buttons */}
                            </div>
                        </div>

                        {/* ===================== CONTEXT MENU ===================== */}
                        {contextMenu.show && (
                            <div
                                ref={contextRef}
                                className="absolute rounded-2xl w-72 p-5 z-50 border transition-all duration-300 ease-out"
                                style={{
                                    top: contextMenu.y,
                                    left: contextMenu.x,
                                    backgroundColor: '#ffffff',
                                    borderColor: '#d6d8ef',
                                    boxShadow: '0 20px 40px rgba(61,77,183,0.10)',
                                    color: '#1a1a2e',
                                    opacity: menuAnimation ? 1 : 0,
                                    transform: menuAnimation ? 'translateX(24px)' : 'translateX(0)'
                                }}
                                onClick={(e) => e.stopPropagation()}>

                                <div className="flex flex-col items-start relative w-full">
                                    <div className="relative">
                                        {cameraLoading ? (
                                            <div className="w-24 h-24 rounded-full border-4 border-[#d6d8ef] shadow-md flex justify-center items-center bg-[#eef0fb]">
                                                <div className="w-10 h-10 border-[3px] border-[#3D4DB7]/20 border-t-[#3D4DB7] rounded-full animate-spin"></div>
                                            </div>
                                        ) : (
                                            <div className="relative w-24 h-24">
                                                {isZoomed ? (
                                                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
                                                        <TransformWrapper
                                                            initialScale={1}
                                                            wheel={{ step: 0.1 }}
                                                            pinch={{ step: 5 }}
                                                            doubleClick={{ disabled: true }}>
                                                            <TransformComponent>
                                                                <img
                                                                    src={avatar}
                                                                    className="max-w-full max-h-full"
                                                                    onClick={() => setIsZoomed(false)}
                                                                />
                                                            </TransformComponent>
                                                        </TransformWrapper>
                                                    </div>
                                                ) : (
                                                    <img
                                                        src={avatar}
                                                        alt="Profile"
                                                        onClick={() => setIsZoomed(true)}
                                                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md cursor-pointer"
                                                    />
                                                )}
                                                <label className="absolute -bottom-1 -right-1 bg-white border border-[#d6d8ef] p-1.5 rounded-full shadow cursor-pointer">
                                                    <FaCamera className="text-[#3D4DB7] text-xs" />
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        onChange={handleProfilePicChange}
                                                    />
                                                </label>
                                            </div>
                                        )}
                                        <p className="mt-3 font-semibold text-sm text-[#1a1a2e]">{userName}</p>
                                    </div>

                                    <div className="w-full mt-3 relative">
                                        {isEditing ? (
                                            <>
                                                <textarea
                                                    value={editedAbout}
                                                    onChange={(e) => setEditedAbout(e.target.value)}
                                                    className="w-full p-2 border border-[#3D4DB7]/30 focus:border-[#3D4DB7] rounded-xl text-sm resize-none bg-[#f4f5fb] text-[#1a1a2e] outline-none transition-all"
                                                    rows={2}
                                                />

                                                <button
                                                    onClick={async () => {
                                                        await handleProfileAboutChange(editedAbout);
                                                        setIsEditing(false);
                                                    }}
                                                    className="mt-2 bg-[#3D4DB7] hover:bg-[#3041a3] text-white px-4 py-1.5 text-sm rounded-xl transition-colors"
                                                >
                                                    Save
                                                </button>
                                            </>
                                        ) : (
                                            <div className="flex justify-between items-center w-full">
                                                <p className="text-sm text-[#1a1a2e]">
                                                    {about || "No about info"}
                                                </p>

                                                <FaPen
                                                    className="text-[#3D4DB7] text-xs cursor-pointer ml-2 flex-shrink-0"
                                                    onClick={() => {
                                                        setEditedAbout(about); // এখানেই about set হবে
                                                        setIsEditing(true);
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-sm text-[#9090a8] mt-2">{email}</p>
                                </div>

                                <button
                                    onClick={handleLogout}
                                    className="mt-6 w-full text-center bg-red-50 hover:bg-red-100 border border-red-200 text-red-500 py-2 rounded-xl transition-colors font-medium tracking-wide">
                                    Log out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Layout;