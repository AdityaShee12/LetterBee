import { useEffect, useState } from "react";
import { BACKEND_API } from "../Backend_API";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import socket from "../socket.js";
import {
  setGroupId,
  setGroupName,
  setGroupAvatar,
  setGroupAbout,
  setGroupMembers,
} from "../features/groupMessageSlice";
import { useNavigate } from "react-router-dom";

const GroupSearch = () => {
  const { userId, userName, userAvatar, userAbout } = useSelector(
    (state) => state.user,
  );
  const [friends, setFriends] = useState([]);
  const [group, setGroup] = useState([]);
  const [createGroup, setCreateGroup] = useState(false);
  const [groupMembers, setgroupMembers] = useState([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [groupName, setgroupName] = useState("");
  const [groupAbout, setgroupAbout] = useState("");
  const [groupAvatar, setgroupAvatar] = useState("");

  // Fetch friends list for group creation

  const fetchFriends = async () => {
    console.log("workff");
    try {
      const response = await axios.get(
        `${BACKEND_API}/api/v1/users/friends?userId=${userId}`,
      );
      console.log("FRI", response.data.data);
      setFriends(Array.isArray(response.data.data) ? response.data.data : []);
      setCreateGroup(true);
    } catch (error) {
      console.error("Failed to fetch friends:", error);
    }
  };

  useEffect(() => {
    console.log("FFr", friends);
  }, [friends]);

  // Fetch every group where user is a participant
  useEffect(() => {
    const fetchGroups = async () => {
      if (!userId) return;
      try {
        const response = await axios.get(
          `${BACKEND_API}/api/v1/users/groupMessage?userId=${userId}`,
        );
        console.log("GrRes", response.data);
        setGroup(response?.data);
        if (response?.data) {
          setCreateGroup(false);
        } else {
          setCreateGroup(true);
        }
      } catch (error) {
        console.error("Failed to fetch groups:", error);
      }
    };

    fetchGroups();
  }, [userId]);

  // Logic to create group
  const create = async () => {
    try {
      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("userName", userName);
      formData.append("userAvatar", userAvatar || "");
      formData.append("userAbout", userAbout || "");
      formData.append("groupName", groupName);
      formData.append("groupMembers", JSON.stringify(groupMembers));
      formData.append("groupAbout", groupAbout || "");
      if (groupAvatar) formData.append("groupAvatar", groupAvatar);
      const response = await axios.post(
        `${BACKEND_API}/api/v1/users/createGroup`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      const { groupId, groupName, groupAvatar, groupAbout, groupUsers } =
        response?.data;
      dispatch(setGroupId({ groupId }));
      dispatch(setGroupName({ groupName }));
      dispatch(setGroupAvatar({ groupAvatar }));
      dispatch(setGroupAbout({ groupAbout }));
      dispatch(setGroupMembers({ groupMembers }));
      navigate(`groupChat/${groupName}`);
    } catch (error) {
      console.error("Failed to create group:", error);
    }
  };

  const groupClick = (group) => {
    const { groupId, groupName, groupAvatar, groupAbout, groupUsers } = group;
    console.log(groupId, groupName, groupAvatar, groupAbout, groupUsers);
    dispatch(setGroupId({ groupId }));
    dispatch(setGroupName({ groupName }));
    dispatch(setGroupAvatar({ groupAvatar }));
    dispatch(setGroupAbout({ groupAbout }));
    dispatch(setGroupMembers({ groupMembers }));
    navigate(`groupChat/${groupName}`);
  };

  const handleAddMember = (friend) => {
    setgroupMembers((prevMembers) => {
      const id = friend?.id;
      if (!id) return prevMembers;
      if (prevMembers.some((m) => m?.id === id)) return prevMembers;
      return [...prevMembers, friend];
    });
  };

  const removeMember = (friend) => {
    const id = friend?.id;
    setgroupMembers((prev) => prev.filter((m) => m?.id !== id));
  };

  const cancelCreate = () => {
    setCreateGroup(false);
    setgroupMembers([]);
    setgroupName("");
    setgroupAbout("");
  };

  return (
    <div className="w-full">
      {createGroup ? (
        <div className="flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">Create group</div>
            <button
              className="px-3 py-1.5 rounded-md bg-slate-200 hover:bg-slate-300 text-sm"
              onClick={cancelCreate}>
              Cancel
            </button>
          </div>

          {/* Selected members */}
          <div className="bg-white/60 rounded-lg p-3 border border-slate-200">
            <div className="text-sm font-medium text-slate-700 mb-2">
              Members ({groupMembers.length})
            </div>
            {groupMembers.length ? (
              <div className="flex flex-wrap gap-2">
                {groupMembers.map((m) => (
                  <button
                    key={m?.id}
                    className="flex items-center gap-2 px-2 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200"
                    onClick={() => removeMember(m)}>
                    <img
                      src={m?.avatar}
                      alt=""
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-sm">{m?.fullName}</span>
                    <span className="text-slate-500 text-sm">×</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500">
                Tap friends below to add members.
              </div>
            )}
          </div>

          {/* Inputs */}
          <div className="flex flex-col gap-3">
            {/* Group Avatar */}
            <div className="flex items-center gap-3">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setGroupAvatar(e.target.files[0])}
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border">
                  {groupAvatar ? (
                    <img
                      src={URL.createObjectURL(groupAvatar)}
                      alt="Group Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-slate-500 text-center">
                      Add
                      <br />
                      Photo
                    </span>
                  )}
                </div>
              </label>

              <div className="text-sm text-slate-600">
                Group avatar
                <div className="text-xs text-slate-400">JPG / PNG</div>
              </div>
            </div>

            {/* Group Name */}
            <input
              type="text"
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setgroupName(e.target.value)}
              className="w-full bg-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#4337e6]"
            />

            {/* Group Description */}
            <input
              type="text"
              placeholder="Group description"
              value={groupAbout}
              onChange={(e) => setgroupAbout(e.target.value)}
              className="w-full bg-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#4337e6]"
            />
          </div>

          {/* Friends list */}
          <div className="flex flex-col gap-2 max-h-[55vh] overflow-y-auto pr-1">
            {friends?.map((friend) => {
              const id = friend?.id;
              const isSelected = groupMembers.some((m) => m?.id === id);
              return (
                <div
                  key={id}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition ${
                    isSelected
                      ? "bg-[#4337e6]/10 border-[#4337e6]/40"
                      : "bg-white/60 border-slate-200 hover:bg-slate-100"
                  }`}
                  onClick={() => handleAddMember(friend)}>
                  <img
                    src={friend?.avatar}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {friend?.fullName}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {isSelected ? "Selected" : "Tap to add"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action */}
          <button
            onClick={create}
            className="w-full mt-1 bg-[#4337e6] hover:bg-[#372ee0] text-white font-medium py-2 rounded-lg disabled:opacity-60"
            disabled={!groupName || !groupAbout || groupMembers.length === 0}>
            Create Group
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mt-[2.5rem] ml-[4rem] max-h-[95vh] overflow-auto">
          {/* Header */}
          <div className="flex justify-between">
            <div className="text-lg font-semibold">Groups</div>
            <button
              className="px-3 py-1.5 rounded-md bg-[#4337e6] hover:bg-[#372ee0] text-white text-sm"
              onClick={fetchFriends}>
              Create group
            </button>
          </div>

          {/* Group list */}
          <div className="flex flex-col gap-2">
            {group.length === 0 ? (
              <div className="text-sm text-slate-500 bg-white/60 border border-slate-200 rounded-lg p-3">
                No groups yet. Create your first group.
              </div>
            ) : (
              group.map((g) => (
                <div
                  key={g.groupId}
                  className="flex items-center gap-3 p-2 rounded-lg cursor-pointer bg-white/60 border border-slate-200 hover:bg-slate-100 transition"
                  onClick={() => groupClick(g)}>
                  <img
                    src={g.groupAvatar}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="font-medium truncate">{g.groupName}</div>
                    <div className="flex gap-2 text-sm text-slate-600 min-w-0">
                      <span className="shrink-0">
                        {g.participant === "sender"
                          ? "You:"
                          : g.senderName
                            ? `${g.senderName}:`
                            : ""}
                      </span>
                      <span className="truncate">{g.lastMessage?.text}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupSearch;
