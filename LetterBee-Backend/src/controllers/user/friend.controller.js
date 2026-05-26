import { asyncHandler } from "../../utils/handlers/asyncHandler.js";
import { User } from "../../models/user/user.model.js"
import { Message } from "../../models/chat/message.model.js";
import { ApiResponse } from "../../utils/response/ApiResponse.js";

const friends = asyncHandler(async (req, res) => {
  const { userId } = req.query;
  console.log("GROU");

  if (!userId) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "User ID is required"));
  }

  const user = await User.findById(userId).select("otherUsers");

  if (!user) {
    return res.status(404).json(new ApiResponse(404, null, "User not found"));
  }

  // Filter only friends and map required fields

  const friendsList = (user.otherUsers || [])
    .filter((friend) => friend.relation === "friend")
    .map((friend) => ({
      id: friend.id,
      fullName: friend.fullName,
      avatar: friend.avatar,
      about: friend.about,
    }));
  console.log("friend", friendsList);

  return res
    .status(200)
    .json(new ApiResponse(200, friendsList, "Friends retrieved successfully"));
});

// It is handle fetching users those names are metch with searching query
const searchUser = asyncHandler(async (req, res) => {
  try {
    const { query, userId } = req.query;
    if (!query) return res.json([]);
    const users = await User.find({
      $or: [
        { fullName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
      _id: { $ne: userId },
    });

    let userData = [];

    if (users.length > 0) {
      let userIds = users.map((user) => user._id);
      const chatRooms = await Message.find({
        "users.id": userId,
        "users.id": { $in: userIds },
        "messages.0": { $exists: true },
      }).sort({ "messages.timestamp": 1 });
      let processedUserIds = new Set();

      chatRooms.forEach((chat) => {
        chat.users.forEach((user) => {
          if (
            user.id.toString() !== userId &&
            !processedUserIds.has(user.id.toString())
          ) {
            processedUserIds.add(user.id.toString());

            const lastMessage = chat.messages[chat.messages.length - 1];
            userData.push({
              _id: user.id,
              fullName: user.fullName,
              avatar: user.avatar || "",
              lastMessage: {
                text: lastMessage?.text || null,
                file: lastMessage?.file || null,
                timestamp: lastMessage?.timestamp || null,
              },
            });
          }
        });
      });
      users.forEach((user) => {
        if (!processedUserIds.has(user._id.toString())) {
          userData.push({
            _id: user._id,
            email: user.email,
            fullName: user.fullName,
            userName: user.userName,
            avatar: user.avatar || "",
            about: user.about
          });
        }
      });
    }
    console.log("Users", userData);
    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

export {
  searchUser,
  friends,
};
