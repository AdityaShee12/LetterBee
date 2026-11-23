import { asyncHandler } from "../../utils/handlers/asyncHandler.js";
import { ApiError } from "../../utils/response/ApiError.js";
import { User } from "../../models/user/user.model.js";
import { ApiResponse } from "../../utils/response/ApiResponse.js";
import { uploadOnCloudinary } from "../../utils/storage/cloudinary.js";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";
import { Otp } from "../../models/auth/otp.model.js";
import brevo from "../../utils/brevo/brevo.js";

const generateAccessAndRefereshTokens = async (userId) => {
  try {

    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token",
    );
  }
};

const sendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "Email is required!",
    });
  }

  const user = await User.findOne({ email });

  if (user) {
    return res.status(400).json({
      message: "This email already has an account",
    });
  }

  const generateOTP = () =>
    Math.floor(100000 + Math.random() * 900000).toString();

  const otp = generateOTP();

  try {
    // Send OTP using Brevo API
    await brevo.transactionalEmails.sendTransacEmail({
      sender: {
        name: process.env.BREVO_SENDER_NAME,
        email: process.env.BREVO_SENDER_EMAIL,
      },

      to: [
        {
          email: email,
        },
      ],

      subject: "Your LetterBee OTP Code",

      htmlContent: `
        <div>
          <h2>Your OTP is: ${otp}</h2>
          <p>This OTP will expire in 5 minutes.</p>
        </div>
      `,
    });

    // Save OTP after email is successfully sent
    const OTP = await Otp.create({
      OTP: otp,
      email: email,
    });

    const responseData = {
      id: OTP._id,
    };

    return res.status(201).json(
      new ApiResponse(
        200,
        responseData,
        "Send otp successfully"
      )
    );
  } catch (error) {
    console.error("Brevo OTP Error:", error);

    return res.status(500).json({
      message: "Failed to send OTP",
    });
  }
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { id, otp } = req.body;
  const Id = await Otp.findById(id);
  let verified;

  if (Id.OTP === otp) {
    verified = 1;
    return res
      .status(200)
      .json(new ApiResponse(200, verified, "User verified Successfully"));
  } else {
    verified = 0;
    return res
      .status(400)
      .json(new ApiResponse(500, verified, "User gave wrong otp"));
  }
});

;

const setPassword = asyncHandler(async (req, res) => {
  const { password, email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json(new ApiResponse(404, null, "User not found"));
  }

  user.password = password; // plain password
  await user.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        _id: user._id,
        fullName: user.fullName,
        avatar: user.avatar,
        about: user.about,
      },
      "Password was changed successfully",
    ),
  );
});

const statusUpload = asyncHandler(async (req, res) => {
  const { userId, userName } = req.body;

  const statusLocalPath = req.files?.status?.[0]?.path;

  const status = await uploadOnCloudinary(statusLocalPath);
  if (!status?.url) {
    throw new ApiError(400, "Failed to upload status file");
  }

  let existingStatus = await Status.findOne({ "uploader.id": userId });

  if (existingStatus) {
    existingStatus.status.push({
      file: status.url,
      timestamp: new Date(),
    });
    await existingStatus.save();
  } else {
    existingStatus = await Status.create({
      uploader: { id: userId, name: userName },
      status: [{ file: status.url, timestamp: new Date() }],
    });
  }

  const userData = existingStatus.status.map((s) => s.file);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        userData,
        existingStatus
          ? "All status files fetched successfully"
          : "Status uploaded successfully",
      ),
    );
});

const statusShow = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const user = await User.findById(userId).select("-password -refreshToken");
  if (!user) {
    return res.status(404).json(new ApiResponse(404, null, "User not found"));
  }
  const userStatuses = await Status.find({ "uploader.id": userId }).lean();
  const usersData = userStatuses.flatMap((item) =>
    item.status.map((s) => s.file),
  );
  const friendsData = user?.otherUsers?.length
    ? await Promise.all(
      user.otherUsers.map(async (friend) => {
        const friendStatuses = await Status.find({
          "uploader.id": friend.id,
        }).lean();
        if (!friendStatuses.length) return null;
        const name = friendStatuses[0].uploader.name;
        const files = friendStatuses.flatMap((item) =>
          item.status.map((s) => s.file),
        );
        return {
          friendName: name,
          statuses: files,
        };
      }),
    )
    : [];
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { usersData, friendsData },
        "User and friends' statuses",
      ),
    );
})

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
            fullName: user.fullName,
            avatar: user.avatar || "",
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

// It is fetch all previous users those was chatting with user
const userList = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    const chatRooms = await Message.find({
      "users.id": userId,
      "messages.0": { $exists: true },
    }).sort({ "messages.timestamp": -1 });
    let userData = [];
    if (chatRooms.length > 0) {
      chatRooms.forEach((chat) => {
        chat.users.forEach((user) => {
          if (user.id.toString() !== userId) {
            const lastMessage = chat.messages[chat.messages.length - 1];
            let chatter;
            if (user.id === lastMessage.sender.id) {
              chatter = "reciever";
            } else {
              chatter = "sender";
            }
            userData.push({
              _id: user.id,
              fullName: user.name,
              avatar: user.avatar || "",
              lastMessage: {
                text: lastMessage?.text || null,
                file: lastMessage?.file || null,
                chatter,
                timestamp: lastMessage?.timestamp || null,
              },
            });
          }
        });
      });
    }
    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken;

  if (incomingRefreshToken) { throw new ApiError(401, "Refresh token expired"); }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token expired or already used");
    }

    // Generate NEW tokens
    const { accessToken, refreshToken } =
      await generateAccessAndRefereshTokens(user._id);

    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(200, { accessToken }, "Access token refreshed")
      );
  } catch (error) {
    throw new ApiError(401, error.message || "Invalid refresh token");
  }
});

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

export {
  registerUser,
  sendOtp,
  verifyOtp,
  loginUser,
  logoutUser,
  setPassword,
  profilePicChange,
  profileAboutChange,
  searchUser,
  userList,
  statusUpload,
  statusShow,
  refreshAccessToken,
  friends,
  createGroup,
  groupMessage,
};
