import express from "express";
const router = express.Router();
import auth from "../middleware/auth.js";
import * as ctrls from "../controllers/conversationController.js";
router.use(auth);

router.post("/", ctrls.createConversationController);
router.get("/", ctrls.getConversationsController);
router.get("/:conversationId/messages", ctrls.getMessagesController);

export default router;
