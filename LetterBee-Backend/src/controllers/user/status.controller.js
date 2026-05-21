import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Status } from "../models/Status.model.js";

const statusUpload = asyncHandler(async (req, res) => {
  const { userId, userName } = req.body;
  console.log("Username", userName);

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
});

export {
  statusUpload,
  statusShow,
};
