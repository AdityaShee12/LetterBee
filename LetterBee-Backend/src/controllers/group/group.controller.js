import { asyncHandler } from "../../utils/handlers/asyncHandler.js";
import { Group } from "../../models/group/group.model.js";
import { uploadOnCloudinary } from "../../utils/storage/cloudinary.js"
import mongoose from "mongoose";

const createGroup = asyncHandler(async (req, res) => {

  const { userId, name, bio, subject, members } = req.body;
  console.log("LOG", userId, name, bio, subject, members);

  const avatarLocalPath = req.files?.groupAvatar[0]?.path;

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  console.log("Ava", avatar);

  const group = await Group.create({
    name,
    avatar: avatar.url,
    members,
    bio,
    subject,
    createdBy: userId,
  })

  res.status(201).json(group);
});

const fetchGroups = asyncHandler(async (req, res) => {

  try {
    const { userId } = req.query;

    console.log("groups", userId);
    const groups = await Group.find(
      { members: userId }
    );
    console.log("groups", groups);

    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
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

const searchGroup = asyncHandler(async (req, res) => {

  try {
    const { query, userId } = req.query;

    if (!query) return res.json([]);

    const groups = await Group.find(
      { name: { $regex: query, $options: "i" } },
      { _id: { $ne: userId } },
    );

    let groupData = [];



    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

export {
  createGroup,
  fetchGroups,
  groupMessage,
  searchGroup
};
