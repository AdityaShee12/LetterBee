import { Router } from "express";
import {
  setPassword,
  profilePicChange,
  profileAboutChange,
} from "../controllers/user/profile.controller.js";
import { upload } from "../middlewares/upload/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth/auth.middleware.js";

const router = Router();


router.post("/passwordChange", setPassword);
router.post("/profilePicChange", upload.single("avatar"), verifyJWT, profilePicChange);
router.post("/profileAboutChange", verifyJWT, profileAboutChange);

export default router;
