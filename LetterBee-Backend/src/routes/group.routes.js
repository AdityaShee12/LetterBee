import { Router } from "express";
import { createGroup, fetchGroups, groupMessage } from "../controllers/group/group.controller.js";
import { upload } from "../middlewares/upload/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth/auth.middleware.js"

const router = Router();

router.route("/createGroup").post(
    upload.fields([
        {
            name: "groupAvatar",
            maxCount: 1,
        },
    ]), createGroup,
);

router.route("/fetchGroups").get(fetchGroups);

router.route("/groupMessage").get(verifyJWT, groupMessage);

export default router;
