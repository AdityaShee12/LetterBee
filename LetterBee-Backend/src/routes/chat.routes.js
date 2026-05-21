import { Router } from "express";
// import {
//     searchUser,
//     userList,
// } from "../controllers/user.controller.js";
import { getUserConversations } from "../controllers/chat/conversation.controller.js";
// import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/chatList").get(getUserConversations);
// router.route("/searchUser").get(verifyJWT, searchUser);
// router.route("/userList").get(verifyJWT, userList);

export default router;
