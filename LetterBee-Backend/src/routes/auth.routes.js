import { Router } from "express";
import { sendOtp, verifyOtp } from "../controllers/auth/otp.controller.js";
import { upload } from "../middlewares/upload/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth/auth.middleware.js";
import { registerUser, loginUser, logoutUser, setPassword } from "../controllers/auth/auth.controller.js";
import { refreshAccessToken } from "../controllers/auth/token.controller.js";
import { validateRegister, validateLogin } from "../utils/validations/validateUser.js";

const router = Router();

router.route("/sendOTP").post(sendOtp);
router.route("/verifyOTP").post(verifyOtp);
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
  validateRegister,
  registerUser,
);
router.route("/login").post(validateLogin, loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/passwordChange").post(verifyJWT, setPassword);
router.route("/refreshAccessToken").post(refreshAccessToken);

export default router;
