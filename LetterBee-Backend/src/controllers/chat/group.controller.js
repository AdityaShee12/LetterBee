import { asyncHandler } from "../utils/asyncHandler.js";
import { GroupMessage } from "../models/groupMessage.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

const createGroup = asyncHandler(async (req, res) => {
  const {
    userId,
    userName,
    userAvatar,
    userAbout,
    groupMembers,
    groupName,
    groupAbout,
  } = req.body;

  const avatarLocalPath = req.files?.groupAvatar[0]?.path;
  console.log("avatar", avatarLocalPath);

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  // Creator (Admin)
  const creatorMember = {
    id: userId,
    name: userName,
    avatar: userAvatar,
    about: typeof userAbout === "string" ? userAbout : "",
    role: "admin",
  };
  let parsedGroupMembers = groupMembers;

  if (typeof groupMembers === "string") {
    parsedGroupMembers = JSON.parse(groupMembers);
  }

  // Other members (Participants)
  const formattedMembers = parsedGroupMembers.map((member) => ({
    id: member.id,
    name: member.fullName,
    avatar: member.avatar,
    about: typeof member.about === "string" ? member.about : "",
    role: "participant",
  }));

  // Combine creator + members
  const allMembers = [creatorMember, ...formattedMembers];

  // Create group
  const group = await GroupMessage.create({
    creator: userId, // schema field
    groupName,
    groupAvatar: avatar?.url || "",
    groupAbout,
    groupMembers: allMembers,
  });
  console.log("groupcreated", group);

  res.status(201).json(group);
});

const groupMessage = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const chatRooms = await GroupMessage.find({
      "groupMembers.id": new mongoose.Types.ObjectId(userId),
    }).sort({ updatedAt: -1 });

    console.log("CR", chatRooms);

    const userData = chatRooms.map((chat) => {
      const lastMessage =
        chat.messages && chat.messages.length > 0
          ? chat.messages[chat.messages.length - 1]
          : null;
      console.log(lastMessage);
      return {
        groupId: chat._id,
        groupName: chat.groupName,
        groupAvatar: chat.groupAvatar,
        groupAbout: chat.groupAbout,
        groupMembers: chat.groupMembers,
        lastMessage: lastMessage
          ? {
            text: lastMessage.text || null,
            file: lastMessage.file || null,
            sender: lastMessage.sender
              ? {
                name: lastMessage.sender.name,
              }
              : null,
          }
          : null,
      };
    });

    res.json(userData);
  } catch (error) {
    console.error("GroupMessage Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export {
  createGroup,
  groupMessage,
};
