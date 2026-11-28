import { Router } from "express";
import { getUserLastsms, getallMessages } from "../controllers/chat/conversation.controller.js";
import { verifyJWT } from "../middlewares/auth/auth.middleware.js";
// import { verifyJWT } from "../middlewares/auth.middleware.js";
// import {
//     searchUser,
//     userList,
// } from "../controllers/user.controller.js";

const router = Router();

router.route("/lastSms").get(verifyJWT, getUserLastsms);
router.route("/previousChat").get(verifyJWT, getallMessages);

// router.route("/searchUser").get(verifyJWT, searchUser);
// router.route("/userList").get(verifyJWT, userList);

export default router;
