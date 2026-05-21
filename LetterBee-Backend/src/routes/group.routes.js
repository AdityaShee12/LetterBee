import { Router } from "express";
import {
    groupMessage,
    createGroup,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

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

export default router;
