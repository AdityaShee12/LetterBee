import { Router } from "express";
import {
  searchUser,
  // userList,
  friends,
  searchGroupUser
} from "../controllers/user/friend.controller.js";
import { verifyJWT } from "../middlewares/auth/auth.middleware.js";

const router = Router();

router.route("/searchUser").get(searchUser);
router.route("/searchGroupUser").get(searchGroupUser);
router.route("/friends").get(verifyJWT, friends);

export default router;