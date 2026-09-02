import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { debounce } from "lodash";
import { groupAPI, userAPI } from "../api/api.js";
import { AiOutlineSearch } from "react-icons/ai";
import { setGroupMessage } from "../features/groupMessageSlice.js";
// import CryptoJS from "crypto-js";
// import socket from "../sockets/socket.js";
// // import { groupAPI } from "../api/api";
// import { setSelectUser } from "../features/userSlice";

const GroupSearch = () => {

    const [groupId, setGroupId] = useState("");
    const [userId, setUserId] = useState("");
    const [groupDetails, setGroupDetails] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [name, setFullName] = useState("");
    const [groupBio, setGroupBio] = useState("");
    const [groupSubject, setGroupSubject] = useState("");
    const [groupAvatar, setGroupAvatar] = useState(null);
    const [groupMembers, setGroupMembers] = useState([]);
    const [groupAbout, setGroupAbout] = useState("");
    const [group, setGroup] = useState();
    const [userName, setUserName] = useState("");
    const [email, setEmail] = useState();
    const [avatar, setAvatar] = useState("");
    const [about, setAbout] = useState("");
    const { user } = useSelector(
        (state) => state.user,
    );
    const [recentGroups, setRecentGroups] = useState([]);
    const [users, setUsers] = useState([]);
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const secretKey = "0123456789abcdef0123456789abcdef";
    const iv = "abcdef9876543210abcdef9876543210";
    const dispatch = useDispatch();
    const [chooseMember, setChooseMember] = useState(false);
    const [friends, setFriends] = useState();
    const [selectedMembers, setSelectedMembers] = useState([]);

    useEffect(() => {
        if (!user) return;
        const { _id, fullName, userName, avatar, about } = user;
        console.log("Users", _id, fullName, userName, avatar, about);

        setUserId(_id);
        setAvatar(avatar);
        setFullName(fullName);
        setAbout(about);
    }, [user]);

    useEffect(() => {
        console.log("UserIDS", userId);
    }, [userId]);

    const fetchGroups = debounce(async (searchText) => {
        if (!searchText.trim() || !userId) {
            setUsers([]);
            return;
        }
        try {
            const response = await userAPI.searchGroups({ searchText, userId });

            console.log("Res", response);
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    }, 300);

    const handleMemberSelect = (userId) => {
        setSelectedMembers((prev) => {
            if (prev.includes(userId)) {
                // Already selected → remove
                return prev.filter((id) => id !== userId);
            }
            // Not selected → add
            return [...prev, userId];
        });
    };

    const handleSelectMember = async () => {
        try {
            if (selectedMembers.length === 0) {
                return;
            }
            setChooseMember(false);
            setGroupDetails(true);
        } catch (error) {
            console.error("Create group error:", error);
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim()) return;

        const formData = new FormData();

        formData.append("userId", userId);
        formData.append("name", groupName.trim());
        formData.append("bio", groupBio.trim());
        formData.append("subject", groupSubject.trim());

        if (groupAvatar) {
            formData.append("groupAvatar", groupAvatar);
        }

        const members = [...new Set([userId, ...selectedMembers])];

        members.forEach((memberId) => {
            formData.append("members", memberId);
        });
        for (const [key, value] of formData.entries()) {
            console.log("Formdata", key, value);
        }
        try {
            const response = await groupAPI.createGroups(formData);

            if (response.data) {
                console.log(response.data);
            }
        } catch (error) {
            console.error("Create group error:", error);
        }
    };

    const fetchGroupUser = async () => {

        const friends = await userAPI.searchGroupUser(userId);

        setFriends(friends?.data);
    }

    const newGroup = () => {
        setChooseMember(true)
        fetchGroupUser();
    }

    useEffect(() => {

        const fetchGroups = async (userId) => {
            console.log("UserID", userId);

            const groups = await groupAPI.fetchGroups(userId);
            console.log("Works12", groups);
            setGroup(groups?.data);
        }

        if (userId) {
            fetchGroups(userId);
        }

    }, [userId])

    useEffect(() => {
        console.log("Groupsxc", group);
    }, [group]);

    const handleSelectGroup = (group) => {

        const groupName = group?.name.replace(/\s+/g, "");

        dispatch(setGroupMessage(group))

        setTimeout(() => {
            navigate(`/layout/groupChat/${groupName}`);
        }, 300);

        setQuery("");
    }

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
                        fetchGroups(e.target.value);
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

            {/* Create New Group */}
            <div className="px-3 mt-4">
                <button
                    type="button"
                    onClick={newGroup}
                    className="
            w-full
            h-[42px]
            px-4
            rounded-2xl
            flex
            items-center
            justify-center
            gap-2
            text-[13px]
            font-semibold
            text-[#3D4DB7]
            bg-[rgba(61,77,183,0.07)]
            border
            border-[rgba(61,77,183,0.12)]
            transition-all
            duration-200
            hover:bg-[#3D4DB7]
            hover:text-white
            hover:border-[#3D4DB7]
            hover:shadow-[0_4px_12px_rgba(61,77,183,0.18)]
            active:scale-[0.98]
        "
                >
                    <span className="text-[18px] leading-none font-normal">
                        +
                    </span>

                    <span>
                        Create New Group
                    </span>
                </button>
            </div>

            {chooseMember && (
                <div className="mt-4 px-3">
                    <ul className="flex flex-col gap-1">
                        {friends?.map((friend) => {
                            const isSelected = selectedMembers.includes(friend._id);

                            return (
                                <li
                                    key={friend._id}
                                    onClick={() => handleMemberSelect(friend._id)}
                                    className={`
                            flex items-center gap-3
                            px-3 py-2.5
                            rounded-2xl
                            cursor-pointer
                            transition-all duration-200
                            ${isSelected
                                            ? "bg-[rgba(61,77,183,0.10)]"
                                            : "hover:bg-[rgba(61,77,183,0.07)]"
                                        }
                        `}
                                >
                                    {/* Avatar */}
                                    <img
                                        src={friend?.avatar}
                                        alt={friend?.fullName}
                                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                        style={{
                                            border: "2px solid rgba(61,77,183,0.15)",
                                        }}
                                    />

                                    {/* User Information */}
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-[14px] text-[#1a1a2e] truncate">
                                            {friend?.fullName}
                                        </p>

                                        <p className="text-[12px] text-[#9090a8] truncate mt-0.5">
                                            @{friend?.userName}
                                        </p>
                                    </div>

                                    {/* Checkbox */}
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleMemberSelect(friend._id)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-4 h-4 accent-[#3D4DB7] cursor-pointer"
                                    />
                                </li>
                            );
                        })}
                    </ul>
                    <button
                        type="button"
                        disabled={selectedMembers.length === 0}
                        onClick={handleSelectMember}
                        className="
                w-full
                h-[42px]
                mt-4
                rounded-2xl
                flex
                items-center
                justify-center
                gap-2
                text-[13px]
                font-semibold
                transition-all
                duration-200
                disabled:opacity-40
                disabled:cursor-not-allowed
                text-white
                bg-[#3D4DB7]
                hover:bg-[#3342a3]
                active:scale-[0.98]
                shadow-[0_4px_12px_rgba(61,77,183,0.18)]
            "
                    >
                        Create Group
                    </button>
                </div>
            )}

            {groupDetails && (
                <div className="px-4 mt-5">

                    {/* Header */}
                    <div className="mb-5">
                        <p className="text-[11px] font-semibold tracking-[0.10em] uppercase text-[#b0b0c8]">
                            Group Details
                        </p>

                        <p className="text-[12px] text-[#9090a8] mt-1">
                            Add some details about your new group
                        </p>
                    </div>

                    {/* Group Avatar */}
                    <div className="flex flex-col items-center mb-6">

                        <label
                            htmlFor="group-avatar"
                            className="
                    relative
                    w-[82px]
                    h-[82px]
                    rounded-full
                    flex
                    items-center
                    justify-center
                    cursor-pointer
                    overflow-hidden
                    bg-[rgba(61,77,183,0.08)]
                    border-2
                    border-[rgba(61,77,183,0.15)]
                    hover:border-[#3D4DB7]
                    transition-all
                    duration-200
                "
                        >
                            {groupAvatar ? (
                                <img
                                    src={URL.createObjectURL(groupAvatar)}
                                    alt="Group"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex flex-col items-center">
                                    <span className="text-[25px] text-[#3D4DB7]">
                                        +
                                    </span>

                                    <span className="text-[10px] font-medium text-[#9090a8]">
                                        Add photo
                                    </span>
                                </div>
                            )}

                            <input
                                id="group-avatar"
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={(e) => {
                                    const file = e.target.files?.[0];

                                    if (file) {
                                        setGroupAvatar(file);
                                    }
                                }}
                            />
                        </label>

                        <p className="text-[11px] text-[#b0b0c8] mt-2">
                            Group photo
                        </p>
                    </div>

                    {/* Group Name */}
                    <div className="mb-4">
                        <label className="block text-[12px] font-semibold text-[#1a1a2e] mb-1.5">
                            Group Name
                        </label>

                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Enter group name"
                            maxLength={50}
                            className="
                    w-full
                    h-[42px]
                    rounded-2xl
                    px-4
                    text-[13.5px]
                    outline-none
                    transition-all
                    duration-200
                    bg-[rgba(61,77,183,0.06)]
                    border-[1.5px]
                    border-[rgba(61,77,183,0.12)]
                    text-[#1a1a2e]
                    placeholder:text-[#b0b0c8]
                    focus:bg-white
                    focus:border-[#3D4DB7]
                    focus:shadow-[0_0_0_3px_rgba(61,77,183,0.10)]
                "
                        />
                    </div>

                    {/* Bio */}
                    <div className="mb-4">
                        <label className="block text-[12px] font-semibold text-[#1a1a2e] mb-1.5">
                            Bio
                        </label>

                        <textarea
                            value={groupBio}
                            onChange={(e) => setGroupBio(e.target.value)}
                            placeholder="Tell something about this group..."
                            maxLength={150}
                            rows={3}
                            className="
                    w-full
                    rounded-2xl
                    px-4
                    py-3
                    text-[13.5px]
                    outline-none
                    resize-none
                    transition-all
                    duration-200
                    bg-[rgba(61,77,183,0.06)]
                    border-[1.5px]
                    border-[rgba(61,77,183,0.12)]
                    text-[#1a1a2e]
                    placeholder:text-[#b0b0c8]
                    focus:bg-white
                    focus:border-[#3D4DB7]
                    focus:shadow-[0_0_0_3px_rgba(61,77,183,0.10)]
                "
                        />
                    </div>

                    {/* Subject */}
                    <div className="mb-5">
                        <label className="block text-[12px] font-semibold text-[#1a1a2e] mb-1.5">
                            Subject
                        </label>

                        <input
                            type="text"
                            value={groupSubject}
                            onChange={(e) => setGroupSubject(e.target.value)}
                            placeholder="e.g. Project, Gaming, Friends..."
                            maxLength={50}
                            className="
                    w-full
                    h-[42px]
                    rounded-2xl
                    px-4
                    text-[13.5px]
                    outline-none
                    transition-all
                    duration-200
                    bg-[rgba(61,77,183,0.06)]
                    border-[1.5px]
                    border-[rgba(61,77,183,0.12)]
                    text-[#1a1a2e]
                    placeholder:text-[#b0b0c8]
                    focus:bg-white
                    focus:border-[#3D4DB7]
                    focus:shadow-[0_0_0_3px_rgba(61,77,183,0.10)]
                "
                        />
                    </div>

                    {/* Create Group */}
                    <button
                        type="button"
                        disabled={!groupName.trim()}
                        onClick={handleCreateGroup}
                        className="
                w-full
                h-[42px]
                rounded-2xl
                flex
                items-center
                justify-center
                gap-2
                text-[13px]
                font-semibold
                text-white
                bg-[#3D4DB7]
                hover:bg-[#3342a3]
                active:scale-[0.98]
                transition-all
                duration-200
                shadow-[0_4px_12px_rgba(61,77,183,0.18)]
                disabled:opacity-40
                disabled:cursor-not-allowed
                disabled:hover:bg-[#3D4DB7]
            "
                    >
                        Create Group
                    </button>
                </div>
            )}

            {/* Section label */}
            <div className="px-4 mt-5 mb-2">
                <p className="text-[11px] font-semibold tracking-[0.10em] uppercase text-[#b0b0c8]">
                    Recent
                </p>
            </div>

            {/* Chat list */}
            {group && (
                <ul
                    className="px-2 pb-4 overflow-y-auto max-h-[calc(100vh-140px)] flex flex-col gap-0.5"
                    style={{ scrollbarWidth: "none" }}
                >
                    {group?.map((group) => (
                        <li
                            key={group._id}
                            className="flex gap-3 px-3 py-2.5 rounded-2xl cursor-pointer transition-all duration-200 relative"
                            onClick={() => handleSelectGroup(group)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background =
                                    "rgba(61,77,183,0.07)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                            }}
                        >
                            <div className="relative flex-shrink-0">
                                <img
                                    src={group?.avatar}
                                    alt={group?.name}
                                    className="w-[44px] h-[44px] rounded-full object-cover"
                                    style={{
                                        border: "2px solid rgba(61,77,183,0.15)",
                                    }}
                                />
                            </div>

                            <div className="flex flex-col justify-center min-w-0 flex-1">
                                <p className="font-semibold text-[14px] leading-snug truncate text-[#1a1a2e]">
                                    {group?.name}
                                </p>

                                <p className="text-[12.5px] truncate mt-0.5 text-[#9090a8]">
                                    {group?.lastMessage?.textSms || ""}
                                </p>
                            </div>

                            <div className="flex items-center flex-shrink-0 self-center">
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 14 14"
                                    fill="none"
                                >
                                    <path
                                        d="M5 3.5L8.5 7L5 10.5"
                                        stroke="rgba(61,77,183,0.25)"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {/* Empty state */}
            {/* {recentGroups.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[rgba(61,77,183,0.08)]">
                            <AiOutlineSearch size={22} style={{ color: 'rgba(61,77,183,0.4)' }} />
                        </div>
                        <p className="text-[13px] text-center text-[#b0b0c8]">
                            No chats yet.<br />Search to start a conversation.
                        </p>
                    </div>
                )} */}
        </div >
    );
}

export default GroupSearch;