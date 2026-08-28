// Show users list algorithm
// First fetched previous stored chat from database then stored in recentUsers variable and show this recentUsers value on searchlist.
// If users write any query on searchbar, fetched users based on search query on users variable.
// Then how many users are there in recentUsers compare those users with users of users variable and how many users wil match, will push
// to index 0 and if any users will not match with recentUsers variable's user, also push to first of array

import { chatAPI, userAPI } from "../../api/api.js";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useNavigationType } from "react-router-dom";
import CryptoJS from "crypto-js";
import { debounce } from "lodash";
import socket from "../../sockets/socket.js";
import { AiOutlineSearch } from "react-icons/ai";
import { setSelectUser } from "../../features/userSlice.js";
import { useDispatch, useSelector } from "react-redux";

const ChatSidebar = () => {

    const [userId, setUserId] = useState("");
    const [fullName, setFullName] = useState("");
    const [userName, setUserName] = useState("");
    const [email, setEmail] = useState();
    const [avatar, setAvatar] = useState("");
    const [about, setAbout] = useState("");
    const { user } = useSelector(
        (state) => state.user,
    );
    const [recentUsers, setRecentUsers] = useState([]);
    const [users, setUsers] = useState([]);
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const secretKey = "0123456789abcdef0123456789abcdef";
    const iv = "abcdef9876543210abcdef9876543210";
    const dispatch = useDispatch();

    // Decrypt message after decryption
    function decryptMessage(encryptedText) {
        if (!encryptedText) return "";
        try {
            const bytes = CryptoJS.AES.decrypt(
                encryptedText,
                CryptoJS.enc.Hex.parse(secretKey),
                {
                    iv: CryptoJS.enc.Hex.parse(iv),
                    mode: CryptoJS.mode.CBC,
                    padding: CryptoJS.pad.Pkcs7,
                }
            );
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);
            return decrypted || encryptedText;
        } catch (error) {
            console.error("Decryption failed:", error);
            return encryptedText;
        }
    }

    // After selecting user from userlist
    const handleSelectUser = (otherUser) => {

        const recieverName = otherUser?.otherUser?.fullName.replace(/\s+/g, "");

        dispatch(setSelectUser(otherUser?.otherUser));

        setTimeout(() => {
            navigate(`/layout/chat/${recieverName}`);
        }, 300);

        setQuery("");

        setRecentUsers((prevUsers) => {
            const updatedUsers = prevUsers.filter(
                (recentUser) => recentUser._id === otherUser._id || recentUser.lastMessage,
            );
            // Ensure user is at the top
            const userIndex = updatedUsers.findIndex((u) => u._id === otherUser._id);
            if (userIndex !== -1) {
                const [matchedUser] = updatedUsers.splice(userIndex, 1);
                updatedUsers.unshift(matchedUser);
            }
            return updatedUsers;
        });
    };

    // After sending last message userlist update code
    const handleLastMessage = (data) => {
        const { senderId, sms, fileType, fileName } =
            data;
        const t = decryptMessage(sms);
        setTimeout(() => {
            setRecentUsers((prevUsers) => {
                let updatedUsers = prevUsers.map((user) =>
                    user._id === senderId
                        ? {
                            ...user,
                            lastMessage: {
                                ...user.lastMessage,
                                text: fileType ? "" : t,
                                fileType,
                                fileName,
                            },
                        }
                        : user,
                );
                const index = updatedUsers.findIndex((u) => u._id === userId);
                if (index > -1) {
                    const [moved] = updatedUsers.splice(index, 1);
                    updatedUsers.unshift(moved);
                }
                return updatedUsers;
            });
        }, 1000);
    };

    // It is work for make first position of searchable users on userlist
    const searchRecentChat = () => {
        setRecentUsers((prevUsers) => {
            let updatedUsers = [...prevUsers];
            users.forEach((newUser) => {
                const index = updatedUsers.findIndex(
                    (user) => user._id === newUser._id,
                );
                if (index !== -1) {
                    const [matchedUser] = updatedUsers.splice(index, 1);
                    updatedUsers.unshift(matchedUser);
                } else {
                    updatedUsers.unshift(newUser);
                }
            });
            return updatedUsers;
        });
    };

    // It is fetch users those are matchs with search query
    const fetchUsers = debounce(async (searchText) => {
        if (!searchText.trim() || !userId) {
            setUsers([]);
            return;
        }
        try {
            const response = await userAPI.searchUser({ searchText, userId });

            console.log("Res", response);
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    }, 300);

    // Destructure data of user and assign those data on variable through useState
    useEffect(() => {
        const { _id, email, fullName, userName, avatar, about } = user;
        setUserId(_id);
        setAvatar(avatar);
        setFullName(fullName);
        setEmail(email);
        setUserName(userName);
        setAbout(about);
    }, [user]);

    // After sending last message userlist update code
    useEffect(() => {
        socket.on("last message", handleLastMessage);
    }, []);

    // searchRecentChat code (user transfer to first index for searching)
    useEffect(() => {
        searchRecentChat();
    }, [users]);

    // fetchusers code (show users for typing query)
    useEffect(() => {
        fetchUsers(query);
    }, [query]);

    // Fetching previous stored chat from database
    useEffect(() => {
        if (!userId) return;
        const fetchRecentChats = async () => {
            setTimeout(async () => {
                try {
                    const response = await chatAPI.lastSms(userId);
                    console.log("Response", response);
                    if (response.data) {
                        setRecentUsers(response.data);
                    }
                } catch (error) {
                    console.error("Error fetching recent chats:", error);
                }
            }, 100);
        };
        fetchRecentChats();
    }, [userId]);

    // This code for show online after online
    useEffect(() => {
        if (socket.connected) {
            console.log("Userid", userId);

            socket.emit("new-user-joined", { senderId: userId });
        } else {
            socket.connect();
            socket.emit("new-user-joined", { senderId: userId });
        }
    }, [userId, userName]);

    return (
        <div className="font-sans">
            {/* Searchbar */}
            <div className="relative flex justify-center mt-5 mx-3">
                <AiOutlineSearch
                    size={18}
                    className="absolute left-[1rem] top-1/2 -translate-y-1/2 transition-colors duration-200"
                    style={{ color: 'rgba(61,77,183,0.4)' }}
                />
                <input
                    type="text"
                    value={query}
                    placeholder="Search or start a new chat"
                    onChange={(e) => {
                        setQuery(e.target.value);
                        fetchUsers(e.target.value);
                    }}
                    className="w-full h-[42px] rounded-2xl pl-[2.6rem] pr-4 text-[13.5px] outline-none transition-all duration-200"
                    style={{
                        background: 'rgba(61,77,183,0.06)',
                        border: '1.5px solid rgba(61,77,183,0.12)',
                        color: '#1a1a2e',
                        fontFamily: "'DM Sans', sans-serif",
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = '#3D4DB7';
                        e.target.style.background = '#ffffff';
                        e.target.style.boxShadow = '0 0 0 3px rgba(61,77,183,0.10)';
                        e.target.previousSibling.style.color = '#3D4DB7';
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(61,77,183,0.12)';
                        e.target.style.background = 'rgba(61,77,183,0.06)';
                        e.target.style.boxShadow = 'none';
                        e.target.previousSibling.style.color = 'rgba(61,77,183,0.4)';
                    }}
                />
            </div>

            {/* Section label */}
            <div className="px-4 mt-5 mb-2">
                <p className="text-[11px] font-semibold tracking-[0.10em] uppercase text-[#b0b0c8]">
                    Recent
                </p>
            </div>

            {/* Chat list */}
            <ul
                className="px-2 pb-4 overflow-y-auto max-h-[calc(100vh-140px)] flex flex-col gap-0.5"
                style={{ scrollbarWidth: 'none' }}
            >
                {recentUsers.map((otherUser) => (
                    <li
                        key={otherUser._id}
                        className="flex gap-3 px-3 py-2.5 rounded-2xl cursor-pointer transition-all duration-200 relative"
                        onClick={() => handleSelectUser(otherUser)}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(61,77,183,0.07)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                        }}
                    >
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <img
                                src={otherUser?.otherUser?.avatar}
                                alt={otherUser?.otherUser?.fullName}
                                className="w-[44px] h-[44px] rounded-full object-cover"
                                style={{ border: '2px solid rgba(61,77,183,0.15)' }}
                            />
                        </div>

                        {/* Text content */}
                        <div className="flex flex-col justify-center min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                                <p className="font-semibold text-[14px] leading-snug truncate text-[#1a1a2e]">
                                    {otherUser?.otherUser?.fullName}
                                </p>
                            </div>
                            <p className="text-[12.5px] truncate mt-0.5 text-[#9090a8]">
                                {otherUser?.lastMessage?.fileType ? (
                                    otherUser?.lastMessage?.fileType.startsWith("image/") ? (
                                        <span className="flex items-center gap-1">
                                            <span>📷</span>
                                            <span>Photo</span>
                                        </span>
                                    ) : otherUser?.lastMessage?.fileType.startsWith("video/") ? (
                                        <span className="flex items-center gap-1">
                                            <span>🎥</span>
                                            <span>Video</span>
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1">
                                            <span>📄</span>
                                            <span>
                                                {otherUser?.lastMessage?.fileType
                                                    ? otherUser?.lastMessage?.fileType?.split(".").pop().toUpperCase() + " file"
                                                    : "File"}
                                            </span>
                                        </span>
                                    )
                                ) : otherUser?.lastMessage?.textSms && otherUser?.lastMessage?.textSms?.length > 38 ? (
                                    otherUser?.lastMessage?.textSms.slice(0, 38) + "…"
                                ) : (
                                    otherUser?.lastMessage?.textSms
                                )}
                            </p>
                        </div>

                        {/* Right chevron */}
                        <div className="flex items-center flex-shrink-0 self-center">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M5 3.5L8.5 7L5 10.5" stroke="rgba(61,77,183,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </li>
                ))}

                {/* Empty state */}
                {recentUsers.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[rgba(61,77,183,0.08)]">
                            <AiOutlineSearch size={22} style={{ color: 'rgba(61,77,183,0.4)' }} />
                        </div>
                        <p className="text-[13px] text-center text-[#b0b0c8]">
                            No chats yet.<br />Search to start a conversation.
                        </p>
                    </div>
                )}
            </ul>
        </div>
    );
};

export default ChatSidebar;