import express from "express";
const router = express.Router();
import auth from "../middleware/auth.js";
import * as ctrls from "../controllers/messageController.js";
import { checkGroupMembership } from "../middleware/relationshipMiddleware.js";

router.use(auth);

router.post("/direct", ctrls.sendDirectMessage);
router.post("/group", checkGroupMembership, ctrls.sendGroupMessage);

export default router;
