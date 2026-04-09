import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useNavigationType } from "react-router-dom";
import CryptoJS from "crypto-js";
import { debounce } from "lodash";
import axios from "axios";
import socket from "../socket.js";
import { AiOutlineSearch } from "react-icons/ai";
import { setSelectUser } from "../features/userSlice.js";
import { setChatAction } from "../features/layoutSlice.js";
import { useDispatch, useSelector } from "react-redux";
import { BACKEND_API } from "../Backend_API.js";

const Search = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const secretKey = "0123456789abcdef0123456789abcdef";
  const iv = "abcdef9876543210abcdef9876543210";
  const dispatch = useDispatch();
  const { userId, userName } = useSelector((state) => state.user);

  // For message decryption
  function decryptMessage(encryptedText) {
    if (encryptedText) {
      const bytes = CryptoJS.AES.decrypt(
        encryptedText,
        CryptoJS.enc.Hex.parse(secretKey),
        {
          iv: CryptoJS.enc.Hex.parse(iv),
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        },
      );
      return bytes.toString(CryptoJS.enc.Utf8);
    }
  }

  // Store previous chat
  const fetchRecentChats = async () => {
    setTimeout(async () => {
      try {
        const response = await axios.get(
          `${BACKEND_API}/api/v1/users/userList?userId=${userId}`,   {
          withCredentials: true
        }
        );
        console.log("Res", response);

        if (response.data) {
          const updatedData = response.data.map((data) => ({
            ...data,
            lastMessage: {
              ...data.lastMessage,
              text: decryptMessage(data.lastMessage.text),
            },
          }));
          setRecentUsers(updatedData);
          console.log("Data", updatedData);
        }
      } catch (error) {
        console.error("Error fetching recent chats:", error);
      }
    }, 100);
  };

  // It is fetch users those are matchs with search query
  const fetchUsers = debounce(async (searchText) => {
    if (!searchText.trim()) {
      setUsers([]);
      return;
    }
    try {
      const response = await axios.get(
        `${BACKEND_API}/api/v1/users/searchUser?query=${searchText}&userId=${userId}`,   {
          withCredentials: true
        }
      );
      console.log("Res", response);
      const usersWithUUID = response.data.map((user) => ({
        ...user,
      }));
      console.log("Data", usersWithUUID);
      setUsers(usersWithUUID);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, 300);

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
    console.log("Recentusers", recentUsers);
  };

  // After sending last message userlist update code
  const handleLastMessage = (data) => {
    const { userId, sms, fileType, fileName, sentRequest, receiveRequest } =
      data;
    const t = decryptMessage(sms);
    setTimeout(() => {
      setRecentUsers((prevUsers) => {
        let updatedUsers = prevUsers.map((user) =>
          user._id === userId
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

  // After selecting user from userlist
  const handleSelectUser = (user) => {
    const recieverName = user.fullName.replace(/\s+/g, "");
    dispatch(
      setSelectUser({
        receiverId: user._id,
        receiverName: user.fullName,
        receiverAvatar: user.avatar,
        receiverAbout: user.about,
      }),
    );
    setTimeout(() => {
      navigate(`/layout/chat/${recieverName}`);
    }, 300);
    dispatch(
      setChatAction({
        chatAction: "chatPage",
      }),
    );
    console.log("Workredux");

    setQuery("");
    setRecentUsers((prevUsers) => {
      const updatedUsers = prevUsers.filter(
        (recentUser) => recentUser._id === user._id || recentUser.lastMessage,
      );
      // Ensure user is at the top
      const userIndex = updatedUsers.findIndex((u) => u._id === user._id);
      if (userIndex !== -1) {
        const [matchedUser] = updatedUsers.splice(userIndex, 1);
        updatedUsers.unshift(matchedUser);
      }
      return updatedUsers;
    });
  };

  // This code for show online after online
  useEffect(() => {
    console.log("work");
    if (socket.connected) {
      socket.emit("new-user-joined", userId, userName);
    } else {
      socket.connect();
      socket.emit("new-user-joined", userId, userName);
    }
  }, []);

  // After sending last message userlist update code
  useEffect(() => {
    fetchRecentChats();
    socket.on("last message", handleLastMessage);
  }, []);

  // fetchusers code (show users for typing query)
  useEffect(() => {
    fetchUsers(query);
  }, [query]);

  // searchRecentChat code (user transfer to first index for searching)
  useEffect(() => {
    searchRecentChat();
  }, [users]);

  return (
    <div>
      {/* Searchbar */}
      <div className="relative flex justify-center mt-[2rem] ml-[0.9rem] mr-[0.9rem]">
        <AiOutlineSearch
          size={21}
          className="absolute left-[1rem] top-[0.6rem] text-white/40"
        />
        <input
          type="text"
          value={query}
          placeholder="Search or start a new chat"
          onChange={(e) => {
            setQuery(e.target.value);
            fetchUsers(e.target.value);
          }}
          className="bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:bg-[#4337e6]/10 focus:border-[#4337e6]/70 transition-all pl-[3rem] text-[1rem] w-full h-[2.5rem] rounded-xl"
        />
      </div>
      {/* Searching list */}
      <ul className="pt-[1.5rem] px-[0.6rem] pb-[1rem] overflow-y-auto max-h-[calc(100vh-140px)] custom-scrollbar">
        {recentUsers.map((user) => (
          <li
            key={user._id}
            className="flex gap-3 p-3 mt-1 rounded-xl font-mono cursor-pointer hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
            onClick={() => handleSelectUser(user)}>
            <img
              src={user.avatar}
              className="w-[3rem] h-[3rem] rounded-full object-cover border border-white/10"
            />
            <div className="flex flex-col justify-center">
              {/* min-w-0 is important for truncate */}
              <p className="font-bold text-[1rem] pl-[0.5rem] text-white/90">
                {user.fullName}
              </p>
              <p className="text-white/50 text-[0.9rem] truncate w-40 pl-[0.5rem]">
                {user.lastMessage?.fileType ? (
                  user.lastMessage.fileType.startsWith("image/") ? (
                    <>
                      <span role="img" aria-label="image">
                        📷
                      </span>{" "}
                      Photo
                    </>
                  ) : user.lastMessage.fileType.startsWith("video/") ? (
                    <>
                      <span role="img" aria-label="video">
                        🎥
                      </span>{" "}
                      Video
                    </>
                  ) : (
                    <>
                      <span role="img" aria-label="file">
                        📄
                      </span>{" "}
                      {user.lastMessage.fileName
                        ? user.lastMessage.fileName
                            .split(".")
                            .pop()
                            .toUpperCase() + " file"
                        : "File"}
                    </>
                  )
                ) : user.lastMessage?.text &&
                  user.lastMessage.text.length > 40 ? (
                  user.lastMessage.text.slice(0, 40) + "..."
                ) : (
                  user.lastMessage?.text
                )}
              </p>
            </div>
          </li>
        ))}
      </ul>{" "}
    </div>
  );
};

export default Search;
