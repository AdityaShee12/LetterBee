import { Router } from "express";
import {
  sendOtp,
  verifyOtp,
  registerUser,
  loginUser,
  logoutUser,
  searchUser,
  setPassword,
  profilePicChange,
  profileAboutChange,
  userList,
  statusUpload,
  statusShow,
  refreshAccessToken,
  groupMessage,
  friends,
  createGroup,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/otp").post(sendOtp);
router.route("/verify").post(verifyOtp);
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser,
);
router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT, logoutUser);
router.route("/passwordChange").post(verifyJWT, setPassword);
router.route("/status").post(
  upload.fields([
    {
      name: "status",
      maxCount: 1,
    },
  ]),
  verifyJWT,
  statusUpload,
);
router.post("/profilePicChange", upload.single("avatar"), verifyJWT, profilePicChange);
router.post("/profileAboutChange", verifyJWT, profileAboutChange);
router.route("/searchUser").get(verifyJWT, searchUser);
router.route("/userList").get(verifyJWT, userList);
router.route("/statusShow").post(verifyJWT, statusShow);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/createGroup").post(
  upload.fields([
    {
      name: "groupAvatar",
      maxCount: 1,
    },
  ]), verifyJWT,
  createGroup,
);
router.route("/groupMessage").get(verifyJWT, groupMessage);
router.route("/friends").get(verifyJWT, friends);
export default router;
