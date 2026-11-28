import { asyncHandler } from "../../utils/handlers/asyncHandler.js";
import { ApiResponse } from "../../utils/response/ApiResponse.js";
import { ApiError } from "../../utils/response/ApiError.js";
import { User } from "../../models/user/user.model.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefereshTokens = async (user, sessionId) => {
  
  try {
    const accessToken = user.generateAccessToken(sessionId);
    const refreshToken = user.generateRefreshToken();

    if (sessionId) {
      user.activeSessionId = sessionId;
    }

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

const refreshAccessToken = asyncHandler(async (req, res) => {

  const incomingRefreshToken = req.cookies.refreshToken;

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

    if (user.activeSessionId !== decodedToken.activeSessionId) {
      return res.status(401).json({
        message: "Your account is logged in on another device",
        code: "SESSION_REPLACED"
      });
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token expired or already used");
    }

    // Generate NEW tokens
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user);

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

export {
  generateAccessAndRefereshTokens,
  refreshAccessToken,
};
