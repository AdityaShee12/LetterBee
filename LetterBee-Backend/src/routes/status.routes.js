import { Router } from "express";
import {
  statusUpload,
  statusShow,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

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
router.route("/statusShow").post(verifyJWT, statusShow);

export default router;
