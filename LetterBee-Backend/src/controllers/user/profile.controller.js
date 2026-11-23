import { asyncHandler } from "../../utils/handlers/asyncHandler.js";
import { ApiError } from "../../utils/response/ApiError.js";
import { User } from "../../models/user/user.model.js";
import { ApiResponse } from "../../utils/response/ApiResponse.js";
import { uploadOnCloudinary } from "../../utils/storage/cloudinary.js";

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
        email: user.email,
        fullName: user.fullName,
        userName: user.userName,
        avatar: user.avatar,
        about: user.about,
      },
      "Password was changed successfully",
    ),
  );
});

const profilePicChange = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  console.log(":PROPicChange");
  if (!userId) return res.status(400).json({ message: "User ID missing" });
  const profileData = await User.findById(userId);
  if (!profileData) throw new ApiError(404, "User not found");
  // If avatar provided, upload it
  const avatarLocalPath = req.file?.path;
  if (avatarLocalPath) {
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar?.url) throw new ApiError(500, "Avatar upload failed");
    profileData.avatar = avatar.url;
  }
  await profileData.save();
  return res
    .status(200)
    .json(new ApiResponse(200, profileData, "Profile updated successfully"));
});

const profileAboutChange = asyncHandler(async (req, res) => {
  const { userId, about } = req.body;
  console.log("ProABTCHNG", userId, about);
  if (!userId) return res.status(400).json({ message: "User ID missing" });

  const profileData = await User.findById(userId);
  if (!profileData) throw new ApiError(404, "User not found");

  if (about) {
    profileData.about = about;
  }

  await profileData.save();
  return res
    .status(200)
    .json(new ApiResponse(200, profileData, "Profile updated successfully"));
});

export {
  setPassword,
  profilePicChange,
  profileAboutChange,
};
