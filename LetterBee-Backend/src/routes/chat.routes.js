import { Router } from "express";
import { getUserLastsms, getallMessages } from "../controllers/chat/conversation.controller.js";

// import { verifyJWT } from "../middlewares/auth.middleware.js";
// import {
//     searchUser,
//     userList,
// } from "../controllers/user.controller.js";

const router = Router();

router.route("/lastSms").get(getUserLastsms);
router.route("/previousChat").get(getallMessages);

// router.route("/searchUser").get(verifyJWT, searchUser);
// router.route("/userList").get(verifyJWT, userList);

export default router;
