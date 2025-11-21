import express from "express";
const router = express.Router();
import * as ctrls from "../controllers/postController.js";
import auth from "../middleware/auth.js";

router.get("/me", auth, ctrls.getMyPosts);
router.get("/upload-signature", auth, ctrls.uploadSignature);
router.get("/:username", ctrls.getUserPostsByUsername);
router.post("/", auth, ctrls.createdPost);

export default router;
